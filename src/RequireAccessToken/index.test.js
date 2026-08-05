import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { useAuth0 } from '@auth0/auth0-react';
import { useLocation } from 'react-router';
import RequireAccessToken from './';
import { getTemporaryAccessTokenFromCookies } from '../utils/auth';
import { hasAuth0CallbackParams } from '../utils/auth0';
import { mockStore } from '../__test-helpers/MockStore';

jest.mock('@auth0/auth0-react');
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useLocation: jest.fn(),
  Navigate: ({ to }) => <div data-testid="navigate">{`Navigating to ${to}`}</div>,
}));
jest.mock('../utils/auth');
jest.mock('../utils/auth0');
/* eslint-disable-next-line */
jest.mock('../LoadingOverlay', () => () => <div data-testid="loading">Loading...</div>);

describe('RequireAccessToken', () => {
  const mockToken = { access_token: 'test_token' };
  const PASSWORD_GRANT = { discovery: { ok: true, grant: 'password' }, settled: true };
  const REDIRECT_GRANT = { discovery: { ok: true, grant: 'authorization_code' }, settled: true };
  let store;

  const renderWithProvider = (component, token = { access_token: null }, authDiscovery = PASSWORD_GRANT) => {
    store = mockStore({
      data: { token },
      view: { authDiscovery }
    });

    return render(
      <Provider store={store}>
        {component}
      </Provider>
    );
  };

  beforeEach(() => {
    useLocation.mockReturnValue({ pathname: '/test', search: '' });
    useAuth0.mockReturnValue({ isLoading: false });
    getTemporaryAccessTokenFromCookies.mockReturnValue(null);
    hasAuth0CallbackParams.mockReturnValue(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Auth0 callback handling', () => {
    test('shows loading overlay when Auth0 params are present', () => {
      hasAuth0CallbackParams.mockReturnValue(true);
      useLocation.mockReturnValue({ pathname: '/', search: '?code=abc&state=xyz' });

      renderWithProvider(
        <RequireAccessToken>
          <div>Protected Content</div>
        </RequireAccessToken>
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    test('shows loading overlay when Auth0 is loading and IDP is required', () => {
      useAuth0.mockReturnValue({ isLoading: true });

      renderWithProvider(
        <RequireAccessToken>
          <div>Protected Content</div>
        </RequireAccessToken>,
        { access_token: null },
        REDIRECT_GRANT
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('authentication checks', () => {
    test('renders children when token exists', () => {
      renderWithProvider(
        <RequireAccessToken>
          <div>Protected Content</div>
        </RequireAccessToken>,
        mockToken
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });

    test('renders children when temporary token exists', () => {
      getTemporaryAccessTokenFromCookies.mockReturnValue('temp_token');

      renderWithProvider(
        <RequireAccessToken>
          <div>Protected Content</div>
        </RequireAccessToken>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });

    test('navigates to login when no token exists', () => {
      renderWithProvider(
        <RequireAccessToken>
          <div>Protected Content</div>
        </RequireAccessToken>
      );

      expect(screen.getByTestId('navigate')).toHaveTextContent('Navigating to');
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Auth0 params priority', () => {
    test('shows loading even when no token and no Auth0 loading if Auth0 params present', () => {
      hasAuth0CallbackParams.mockReturnValue(true);
      useAuth0.mockReturnValue({ isLoading: false });
      useLocation.mockReturnValue({ pathname: '/', search: '?code=abc&state=xyz' });

      renderWithProvider(
        <RequireAccessToken>
          <div>Protected Content</div>
        </RequireAccessToken>
      );

      // Should show loading, not navigate to login
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });
  });
});
