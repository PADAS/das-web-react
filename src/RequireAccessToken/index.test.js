import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { useAuth0 } from '@auth0/auth0-react';
import { useLocation } from 'react-router';
import RequireAccessToken from './';
import { getTemporaryAccessTokenFromCookies } from '../utils/auth';
import { hasOAuthCallbackParams } from '../utils/oauth';
import { mockStore } from '../__test-helpers/MockStore';

jest.mock('@auth0/auth0-react');
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useLocation: jest.fn(),
  Navigate: ({ to }) => <div data-testid="navigate">{`Navigating to ${to}`}</div>,
}));
jest.mock('../utils/auth');
jest.mock('../utils/oauth');
jest.mock('../LoadingOverlay', () => () => <div data-testid="loading">Loading...</div>);

describe('RequireAccessToken', () => {
  const mockToken = { access_token: 'test_token' };
  const mockSystemConfig = { require_idp: false };
  let store;

  const renderWithProvider = (component, token = { access_token: null }, systemConfig = mockSystemConfig) => {
    store = mockStore({
      data: { token },
      view: { systemConfig }
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
    hasOAuthCallbackParams.mockReturnValue(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('OAuth callback handling', () => {
    test('shows loading overlay when OAuth params are present', () => {
      hasOAuthCallbackParams.mockReturnValue(true);
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
        { require_idp: true }
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

  describe('OAuth params priority', () => {
    test('shows loading even when no token and no Auth0 loading if OAuth params present', () => {
      hasOAuthCallbackParams.mockReturnValue(true);
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
