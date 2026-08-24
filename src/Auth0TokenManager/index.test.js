import { renderHook, waitFor } from '@testing-library/react';
import { useAuth0 } from '@auth0/auth0-react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import appConfig from '../config';
import Auth0TokenManager from './';
import { hasAuth0CallbackParams } from '../utils/auth0';
import {
  isValidTokenFormat,
  markLocalUserNotProvisioned,
  takeLocalUserLoginAttempt,
} from '../utils/auth';
import { REACT_APP_ROUTE_PREFIX } from '../constants';
import useNavigate from '../hooks/useNavigate';
import { GATE_RESULT, checkAccountLinked } from '../utils/account-linking';
import { applyAccessToken, clearAuth } from '../ducks/auth';
import { redirectToExternalUrl } from '../utils/navigation';

jest.mock('@auth0/auth0-react');
jest.mock('react-redux');
jest.mock('react-router');
jest.mock('../utils/auth0');
jest.mock('../utils/auth');
jest.mock('../hooks/useNavigate');
jest.mock('../utils/account-linking', () => {
  const actual = jest.requireActual('../utils/account-linking');
  return { __esModule: true, ...actual, checkAccountLinked: jest.fn() };
});
jest.mock('../utils/navigation', () => ({
  ...jest.requireActual('../utils/navigation'),
  redirectToExternalUrl: jest.fn(),
}));
jest.mock('../ducks/auth', () => ({
  __esModule: true,
  ...jest.requireActual('../ducks/auth'),
  applyAccessToken: jest.fn(() => ({ type: 'APPLY_ACCESS_TOKEN' })),
  clearAuth: jest.fn(() => ({ type: 'CLEAR_AUTH' })),
}));

describe('Auth0TokenManager', () => {
  let mockDispatch;
  let mockNavigate;
  let mockGetAccessTokenSilently;
  let mockLogout;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockNavigate = jest.fn();
    mockGetAccessTokenSilently = jest.fn();
    mockLogout = jest.fn().mockResolvedValue();

    useDispatch.mockReturnValue(mockDispatch);
    useNavigate.mockReturnValue(mockNavigate);
    useLocation.mockReturnValue({ search: '' });
    useSelector.mockImplementation((selector) => {
      const state = {
        data: { token: { access_token: null } },
        view: { systemConfig: { require_idp: true, idp_org_id: null } }
      };
      return selector(state);
    });
    useAuth0.mockReturnValue({
      isAuthenticated: false,
      getAccessTokenSilently: mockGetAccessTokenSilently,
      logout: mockLogout,
    });
    hasAuth0CallbackParams.mockReturnValue(false);
    isValidTokenFormat.mockReturnValue(true);
    // Default the gate to "linked" so the existing pre-gate tests proceed.
    checkAccountLinked.mockResolvedValue({ result: GATE_RESULT.LINKED });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Auth0 callback handling', () => {
    test('processes Auth0 callback when params are present and user becomes authenticated', async () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
      mockGetAccessTokenSilently.mockResolvedValue(validToken);

      // First render: Auth0 params present, not authenticated yet
      hasAuth0CallbackParams.mockReturnValue(true);
      useLocation.mockReturnValue({ search: '?code=abc&state=xyz' });
      useAuth0.mockReturnValue({
        isAuthenticated: false,
        getAccessTokenSilently: mockGetAccessTokenSilently,
      });

      const { rerender } = renderHook(() => Auth0TokenManager());

      // Second render: Auth0Provider has processed callback, user now authenticated
      useAuth0.mockReturnValue({
        isAuthenticated: true,
        getAccessTokenSilently: mockGetAccessTokenSilently,
      });
      hasAuth0CallbackParams.mockReturnValue(false);
      useLocation.mockReturnValue({ search: '' });

      rerender();

      await waitFor(() => {
        expect(mockGetAccessTokenSilently).toHaveBeenCalledWith({
          authorizationParams: {
            audience: appConfig.auth0.audience,
          },
        });
      });
    });

    test('does not process callback twice', async () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
      mockGetAccessTokenSilently.mockResolvedValue(validToken);

      hasAuth0CallbackParams.mockReturnValue(true);
      useLocation.mockReturnValue({ search: '?code=abc&state=xyz' });
      useAuth0.mockReturnValue({
        isAuthenticated: true,
        getAccessTokenSilently: mockGetAccessTokenSilently,
      });

      const { rerender } = renderHook(() => Auth0TokenManager());

      await waitFor(() => {
        expect(mockGetAccessTokenSilently).toHaveBeenCalledTimes(1);
      });

      // Rerender - should not call again
      rerender();

      await waitFor(() => {
        expect(mockGetAccessTokenSilently).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('error handling', () => {
    test('navigates to login on invalid token format', async () => {
      const invalidToken = 'not-a-valid-jwt';
      mockGetAccessTokenSilently.mockResolvedValue(invalidToken);
      isValidTokenFormat.mockReturnValue(false);

      hasAuth0CallbackParams.mockReturnValue(true);
      useLocation.mockReturnValue({ search: '?code=abc&state=xyz' });
      useAuth0.mockReturnValue({
        isAuthenticated: true,
        getAccessTokenSilently: mockGetAccessTokenSilently,
      });

      renderHook(() => Auth0TokenManager());

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('login'), { replace: true });
      });
    });

    test('navigates to login on token fetch error', async () => {
      mockGetAccessTokenSilently.mockRejectedValue(new Error('Token fetch failed'));

      hasAuth0CallbackParams.mockReturnValue(true);
      useLocation.mockReturnValue({ search: '?code=abc&state=xyz' });
      useAuth0.mockReturnValue({
        isAuthenticated: true,
        getAccessTokenSilently: mockGetAccessTokenSilently,
      });

      renderHook(() => Auth0TokenManager());

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('login'), { replace: true });
      });
    });
  });

  describe('account-linking gate', () => {
    const VALID_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';

    const renderAfterCallback = () => {
      hasAuth0CallbackParams.mockReturnValue(true);
      useLocation.mockReturnValue({ search: '?code=abc&state=xyz' });
      useAuth0.mockReturnValue({
        isAuthenticated: true,
        getAccessTokenSilently: mockGetAccessTokenSilently,
        logout: mockLogout,
      });
      return renderHook(() => Auth0TokenManager());
    };

    beforeEach(() => {
      mockGetAccessTokenSilently.mockResolvedValue(VALID_TOKEN);
    });

    test('204 (linked): enters the authenticated state', async () => {
      checkAccountLinked.mockResolvedValue({ result: GATE_RESULT.LINKED });

      renderAfterCallback();

      await waitFor(() => {
        expect(applyAccessToken).toHaveBeenCalledWith(VALID_TOKEN);
      });
      expect(checkAccountLinked).toHaveBeenCalledWith(VALID_TOKEN);
    });

    test('200 (unlinked): hands off to the link page and does not authenticate', async () => {
      checkAccountLinked.mockResolvedValue({
        result: GATE_RESULT.UNLINKED,
        linkUrl: 'https://site.example/auth/link-accounts/',
      });

      renderAfterCallback();

      await waitFor(() => {
        expect(redirectToExternalUrl).toHaveBeenCalledWith('https://site.example/auth/link-accounts/');
      });
      // No authenticated-state transition, no SPA navigation, no token teardown.
      expect(applyAccessToken).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockLogout).not.toHaveBeenCalled();
    });

    test('400 (invalid): clears the SDK and SPA token state, returns to login, does not authenticate', async () => {
      checkAccountLinked.mockResolvedValue({ result: GATE_RESULT.INVALID });

      renderAfterCallback();

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledWith({ openUrl: false });
      });
      expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('login'), { replace: true });
      expect(applyAccessToken).not.toHaveBeenCalled();
    });

    test('transient failure: leaves the user at login with a retryable error and no token teardown', async () => {
      checkAccountLinked.mockResolvedValue({ result: GATE_RESULT.TRANSIENT });

      renderAfterCallback();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          expect.stringContaining('login'),
          { replace: true, state: { authLinkingError: true } }
        );
      });
      expect(mockLogout).not.toHaveBeenCalled();
      expect(applyAccessToken).not.toHaveBeenCalled();
    });

    describe('local-user sign-in', () => {
      beforeEach(() => {
        takeLocalUserLoginAttempt.mockReturnValue(false);
        checkAccountLinked.mockResolvedValue({
          result: GATE_RESULT.UNLINKED,
          linkUrl: 'https://site.example/auth/link-accounts/',
        });
      });

      test('an unlinked local user is signed out of Auth0 rather than sent to the account linker', async () => {
        takeLocalUserLoginAttempt.mockReturnValue(true);

        renderAfterCallback();

        // Ending the tenant session, not just the local cache, is the protection:
        // the Auth0 cookie would otherwise re-authenticate this unusable identity
        // on the next sign-in from any entry point.
        await waitFor(() => {
          expect(mockLogout).toHaveBeenCalledWith({
            logoutParams: { returnTo: `${window.location.origin}${REACT_APP_ROUTE_PREFIX}` },
          });
        });
        // The flag carries the message home across the logout redirect; it is not
        // what makes the state safe.
        expect(markLocalUserNotProvisioned).toHaveBeenCalled();
        expect(clearAuth).toHaveBeenCalled();
        // The linker asks for a legacy password a local user does not have.
        expect(redirectToExternalUrl).not.toHaveBeenCalled();
        // The mapping is missing, so no token reaches the app to 401 on every call.
        expect(applyAccessToken).not.toHaveBeenCalled();
        // The logout redirect navigates; an SPA navigation would race it.
        expect(mockNavigate).not.toHaveBeenCalled();
      });

      test('a logout that fails still lands the user on the login page instead of a stuck overlay', async () => {
        takeLocalUserLoginAttempt.mockReturnValue(true);
        mockLogout.mockRejectedValue(new Error('logout failed'));

        renderAfterCallback();

        // The SDK clears its local session before redirecting, so a failure here
        // leaves the Auth0 session alive — nothing the client can undo. What it must
        // not do is strand the user on the callback URL, where the guard holds the
        // overlay forever. The flag is already set, so the login page explains.
        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith(
            expect.stringContaining('login'),
            { replace: true, state: { localUserSignInFailed: true } }
          );
        });
        expect(applyAccessToken).not.toHaveBeenCalled();
      });

      test('a transient gate failure after a local-user attempt still names that path', async () => {
        takeLocalUserLoginAttempt.mockReturnValue(true);
        checkAccountLinked.mockResolvedValue({ result: GATE_RESULT.TRANSIENT });

        renderAfterCallback();

        // Without this the user gets the generic "couldn't finish signing you in",
        // with nothing to say the local-user path was involved.
        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith(
            expect.stringContaining('login'),
            { replace: true, state: { localUserSignInFailed: true } }
          );
        });
      });

      test('an unusable token after a local-user attempt still names that path', async () => {
        takeLocalUserLoginAttempt.mockReturnValue(true);
        checkAccountLinked.mockResolvedValue({ result: GATE_RESULT.INVALID });

        renderAfterCallback();

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith(
            expect.stringContaining('login'),
            { replace: true, state: { localUserSignInFailed: true } }
          );
        });
      });

      test('the flag is set before the logout that carries it home', async () => {
        takeLocalUserLoginAttempt.mockReturnValue(true);
        const order = [];
        markLocalUserNotProvisioned.mockImplementation(() => order.push('mark'));
        mockLogout.mockImplementation(() => {
          order.push('logout');
          return Promise.resolve();
        });

        renderAfterCallback();

        // Marking after the redirect starts would be a race the comment claims we
        // avoid; nothing pinned the order until now.
        await waitFor(() => expect(order).toEqual(['mark', 'logout']));
      });

      test('an unlinked common-DB user still reaches the account linker', async () => {
        renderAfterCallback();

        await waitFor(() => {
          expect(redirectToExternalUrl).toHaveBeenCalledWith('https://site.example/auth/link-accounts/');
        });
        expect(mockNavigate).not.toHaveBeenCalled();
      });

      test('a linked local user authenticates without any linking hand-off', async () => {
        takeLocalUserLoginAttempt.mockReturnValue(true);
        checkAccountLinked.mockResolvedValue({ result: GATE_RESULT.LINKED });

        renderAfterCallback();

        await waitFor(() => {
          expect(applyAccessToken).toHaveBeenCalledWith(VALID_TOKEN);
        });
        expect(redirectToExternalUrl).not.toHaveBeenCalled();
      });
    });

    test('org-scoped (idp_org_id set): skips the gate and authenticates', async () => {
      useSelector.mockImplementation((selector) => selector({
        data: { token: { access_token: null } },
        view: { systemConfig: { require_idp: true, idp_org_id: 'org_abc' } },
      }));

      renderAfterCallback();

      await waitFor(() => {
        expect(applyAccessToken).toHaveBeenCalledWith(VALID_TOKEN);
      });
      expect(checkAccountLinked).not.toHaveBeenCalled();
    });
  });
});
