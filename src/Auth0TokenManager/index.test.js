import { renderHook, waitFor } from '@testing-library/react';
import { useAuth0 } from '@auth0/auth0-react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import auth0Config from '../auth0-config';
import Auth0TokenManager from './';
import { hasAuth0CallbackParams } from '../utils/auth0';
import { isValidTokenFormat } from '../utils/auth';
import useNavigate from '../hooks/useNavigate';

jest.mock('@auth0/auth0-react');
jest.mock('react-redux');
jest.mock('react-router');
jest.mock('../utils/auth0');
jest.mock('../utils/auth');
jest.mock('../hooks/useNavigate');

describe('Auth0TokenManager', () => {
  let mockDispatch;
  let mockNavigate;
  let mockGetAccessTokenSilently;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockNavigate = jest.fn();
    mockGetAccessTokenSilently = jest.fn();

    useDispatch.mockReturnValue(mockDispatch);
    useNavigate.mockReturnValue(mockNavigate);
    useLocation.mockReturnValue({ search: '' });
    useSelector.mockImplementation((selector) => {
      const state = {
        data: { token: { access_token: null } },
        view: { systemConfig: { require_idp: true } }
      };
      return selector(state);
    });
    useAuth0.mockReturnValue({
      isAuthenticated: false,
      getAccessTokenSilently: mockGetAccessTokenSilently,
    });
    hasAuth0CallbackParams.mockReturnValue(false);
    isValidTokenFormat.mockReturnValue(true);
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
            audience: auth0Config.audience,
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
});
