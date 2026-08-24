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
  Navigate: ({ to }) => <div data-testid="navigate">
    {`Navigating to ${typeof to === 'string' ? to : `${to.pathname}${to.search || ''}`}`}
  </div>,
}));
jest.mock('../utils/auth');
jest.mock('../utils/auth0');
/* eslint-disable-next-line */
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

    test('forwards an error that arrives without a description, which Auth0 need not send', () => {
      useLocation.mockReturnValue({ pathname: '/', search: '?error=invalid_request' });

      renderWithProvider(
        <RequireAccessToken>
          <div>Protected Content</div>
        </RequireAccessToken>
      );

      expect(screen.getByTestId('navigate')).toHaveTextContent(
        'Navigating to /login?error=invalid_request'
      );
    });

    test('does not carry unrelated query params to login', () => {
      // The login page reads only the Auth0 error params. Anything else copied
      // over is noise at best, and the error_description it renders verbatim is
      // not worth making reachable from every protected URL.
      useLocation.mockReturnValue({ pathname: '/events', search: '?reportType=carcass_rep' });

      renderWithProvider(
        <RequireAccessToken>
          <div>Protected Content</div>
        </RequireAccessToken>
      );

      const target = screen.getByTestId('navigate');
      expect(target).toHaveTextContent('Navigating to /login');
      expect(target).not.toHaveTextContent('reportType');
    });

    test('carries an Auth0 error query string through to login', () => {
      // An Auth0 error redirect returns error and state but no code, so it is not
      // a callback and lands on the app root. This redirect is the only thing that
      // can hand those params to the login page, which is where they are explained.
      useLocation.mockReturnValue({
        pathname: '/',
        search: '?error=access_denied&error_description=Something+Auth0+said',
      });

      renderWithProvider(
        <RequireAccessToken>
          <div>Protected Content</div>
        </RequireAccessToken>
      );

      expect(screen.getByTestId('navigate')).toHaveTextContent(
        'Navigating to /login?error=access_denied&error_description=Something+Auth0+said'
      );
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
