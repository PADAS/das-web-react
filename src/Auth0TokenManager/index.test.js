import { renderHook, waitFor } from '@testing-library/react';
import { useAuth0 } from '@auth0/auth0-react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import appConfig from '../config';
import Auth0TokenManager from './';
import { hasAuth0CallbackParams } from '../utils/auth0';
import { isValidTokenFormat } from '../utils/auth';
import useNavigate from '../hooks/useNavigate';
import { GATE_RESULT, checkAccountLinked } from '../utils/account-linking';
import { POST_AUTH_SUCCESS } from '../ducks/auth';
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
        expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: POST_AUTH_SUCCESS }));
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
      expect(mockDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: POST_AUTH_SUCCESS }));
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockLogout).not.toHaveBeenCalled();
    });

    test('200 (unlinked) with a missing URL: routes to login with a retryable error', async () => {
      checkAccountLinked.mockResolvedValue({ result: GATE_RESULT.UNLINKED, linkUrl: '' });

      renderAfterCallback();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          expect.stringContaining('login'),
          { replace: true, state: { authLinkingError: true } }
        );
      });
      expect(redirectToExternalUrl).not.toHaveBeenCalled();
    });

    test('400 (invalid): clears the SDK and SPA token state, returns to login, does not authenticate', async () => {
      checkAccountLinked.mockResolvedValue({ result: GATE_RESULT.INVALID });

      renderAfterCallback();

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledWith({ openUrl: false });
      });
      expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('login'), { replace: true });
      expect(mockDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: POST_AUTH_SUCCESS }));
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
      expect(mockDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: POST_AUTH_SUCCESS }));
    });

    test('org-scoped (idp_org_id set): skips the gate and authenticates', async () => {
      useSelector.mockImplementation((selector) => selector({
        data: { token: { access_token: null } },
        view: { systemConfig: { require_idp: true, idp_org_id: 'org_abc' } },
      }));

      renderAfterCallback();

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: POST_AUTH_SUCCESS }));
      });
      expect(checkAccountLinked).not.toHaveBeenCalled();
    });
  });
});
