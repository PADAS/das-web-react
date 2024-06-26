import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { render, screen, waitFor } from '../test-utils';

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
    userEvent.type(usernameInput, usernameText);
    const passwordInput = await screen.findByLabelText('Password');
    userEvent.type(passwordInput, passwordText);
    const formSubmitButton = await screen.findByRole('button');

    userEvent.click(formSubmitButton);
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
});