import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { render, screen, waitFor } from '../test-utils';

import auth0Config from '../auth0-config';
import { fetchEula } from '../ducks/eula';
import { fetchSystemStatus } from '../ducks/system-status';
import Login from './';
import { mockStore } from '../__test-helpers/MockStore';
import { postAuth, clearAuth } from '../ducks/auth';
import useNavigate from '../hooks/useNavigate';

jest.mock('../ducks/eula', () => ({
  ...jest.requireActual('../ducks/eula'),
  fetchEula: jest.fn(),
}));
jest.mock('../ducks/system-status', () => ({
  ...jest.requireActual('../ducks/system-status'),
  fetchSystemStatus: jest.fn(),
}));
jest.mock('../ducks/auth', () => ({
  ...jest.requireActual('../ducks/auth'),
  postAuth: jest.fn(),
  clearAuth: jest.fn(),
}));
jest.mock('../hooks/useNavigate', () => jest.fn());
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: jest.fn(),
}));

const { useAuth0 } = require('@auth0/auth0-react');

describe('Login', () => {
  const username = 'er_user', password = 'er_password';
  let clearAuthMock, fetchEulaMock, fetchSystemStatusMock, navigate, postAuthMock, store, useNavigateMock;

  beforeEach(() => {
    fetchEulaMock = jest.fn(() => () => Promise.resolve());
    fetchEula.mockImplementation(fetchEulaMock);
    fetchSystemStatusMock = jest.fn(() => () => Promise.resolve());
    fetchSystemStatus.mockImplementation(fetchSystemStatusMock);
    postAuthMock = jest.fn((formData) => () => {
      return formData.username === username && formData.password === password
        ? Promise.resolve()
        : Promise.reject({ toJSON: () => {} });
    });
    postAuth.mockImplementation(postAuthMock);
    clearAuthMock = jest.fn(() => () => Promise.resolve());
    clearAuth.mockImplementation(clearAuthMock);
    navigate = jest.fn();
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);

    // Default Auth0 mock for non-IDP mode
    useAuth0.mockReturnValue({
      loginWithRedirect: jest.fn(),
      isLoading: false,
    });

    store = mockStore({ data: { eula: { eula_url: '' } }, view: { systemConfig: {} } });

    render(
      <Provider store={store}>
        <Login />
      </Provider>
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const login = async (usernameText = username, passwordText = password) => {
    const usernameInput = await screen.findByLabelText('Username');
    await userEvent.type(usernameInput, usernameText);
    const passwordInput = await screen.findByLabelText('Password');
    await userEvent.type(passwordInput, passwordText);
    const formSubmitButton = await screen.findByRole('button');

    await userEvent.click(formSubmitButton);
  };

  test('navigates to map after a successful login', async () => {
    expect(navigate).toHaveBeenCalledTimes(0);

    await login();

    await waitFor(async () => {
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith({ pathname: '/', search: '' }, {});
    });
  });

  test('shows error message after a failed login', async () => {
    await login('notUser', 'notPassword');

    await waitFor(async () => {
      await screen.findByText('An error has occurred. Please try again.');
    });
  });

  describe('Auth0 IDP mode', () => {
    test('shows Auth0 sign in button when require_idp is true', async () => {
      const loginWithRedirect = jest.fn();
      useAuth0.mockReturnValue({
        loginWithRedirect,
        isLoading: false,
      });

      const idpStore = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: { require_idp: true, idp_org_id: 'org_123' } }
      });

      render(
        <Provider store={idpStore}>
          <Login />
        </Provider>
      );

      const signInButton = await screen.findByText('Sign in');
      expect(signInButton).toBeInTheDocument();
    });

    test('calls loginWithRedirect when Auth0 sign in button is clicked', async () => {
      const loginWithRedirect = jest.fn().mockResolvedValue({});
      useAuth0.mockReturnValue({
        loginWithRedirect,
        isLoading: false,
      });

      const idpStore = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: { require_idp: true, idp_org_id: 'org_456' } }
      });

      render(
        <Provider store={idpStore}>
          <Login />
        </Provider>
      );

      const signInButton = await screen.findByText('Sign in');
      await userEvent.click(signInButton);

      expect(loginWithRedirect).toHaveBeenCalledWith({
        authorizationParams: {
          organization: 'org_456',
          audience: auth0Config.audience,
        },
      });
    });

    test('shows error when IDP organization is not configured', async () => {
      useAuth0.mockReturnValue({
        loginWithRedirect: jest.fn(),
        isLoading: false,
      });

      const idpStore = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: { require_idp: true, idp_org_id: null } }
      });

      render(
        <Provider store={idpStore}>
          <Login />
        </Provider>
      );

      const errorMessages = await screen.findAllByText('Identity provider organization is not configured.');
      expect(errorMessages.length).toBeGreaterThanOrEqual(1);
    });

    test('shows error when loginWithRedirect fails', async () => {
      const loginWithRedirect = jest.fn().mockRejectedValue(new Error('Auth0 error'));
      useAuth0.mockReturnValue({
        loginWithRedirect,
        isLoading: false,
      });

      const idpStore = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: { require_idp: true, idp_org_id: 'org_789' } }
      });

      render(
        <Provider store={idpStore}>
          <Login />
        </Provider>
      );

      const signInButton = await screen.findByText('Sign in');
      await userEvent.click(signInButton);

      await waitFor(async () => {
        const errorMessage = await screen.findByText('Sign-in failed. Please try again.');
        expect(errorMessage).toBeInTheDocument();
      });
    });

    test('shows access denied error from Auth0 URL params', async () => {
      useAuth0.mockReturnValue({
        loginWithRedirect: jest.fn(),
        isLoading: false,
      });

      const idpStore = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: { require_idp: true, idp_org_id: 'org_123' } }
      });

      render(
        <Provider store={idpStore}>
          <Login />
        </Provider>,
        { initialEntries: ['/login?error=access_denied&error_description=User%20is%20not%20part%20of%20the%20organization'] }
      );

      await waitFor(async () => {
        const errorMessage = await screen.findByText('Access denied: Your account is not authorized for this organization. Please contact your administrator.');
        expect(errorMessage).toBeInTheDocument();
      });
    });

    test('shows authentication failed error from Auth0 URL params', async () => {
      useAuth0.mockReturnValue({
        loginWithRedirect: jest.fn(),
        isLoading: false,
      });

      const idpStore = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: { require_idp: true, idp_org_id: 'org_123' } }
      });

      render(
        <Provider store={idpStore}>
          <Login />
        </Provider>,
        { initialEntries: ['/login?error=unauthorized&error_description=Invalid%20credentials'] }
      );

      await waitFor(async () => {
        const errorMessage = await screen.findByText('Authentication failed: Please check your credentials and try again.');
        expect(errorMessage).toBeInTheDocument();
      });
    });

    test('shows generic authentication error from Auth0 URL params', async () => {
      useAuth0.mockReturnValue({
        loginWithRedirect: jest.fn(),
        isLoading: false,
      });

      const idpStore = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: { require_idp: true, idp_org_id: 'org_123' } }
      });

      render(
        <Provider store={idpStore}>
          <Login />
        </Provider>,
        { initialEntries: ['/login?error=server_error&error_description=Internal%20server%20error'] }
      );

      await waitFor(async () => {
        const errorMessage = await screen.findByText('Authentication error: Internal server error');
        expect(errorMessage).toBeInTheDocument();
      });
    });

  });
});