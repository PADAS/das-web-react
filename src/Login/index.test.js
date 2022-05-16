import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { fetchEula } from '../ducks/eula';
import { fetchSystemStatus } from '../ducks/system-status';
import Login from './';
import { mockStore } from '../__test-helpers/MockStore';
import NavigationWrapper from '../__test-helpers/navigationWrapper';
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
  let clearAuthMock, fetchEulaMock, fetchSystemStatusMock, navigate, postAuthMock, store, useNavigateMock;
  beforeEach(() => {
    fetchEulaMock = jest.fn(() => () => Promise.resolve());
    fetchEula.mockImplementation(fetchEulaMock);
    fetchSystemStatusMock = jest.fn(() => () => Promise.resolve());
    fetchSystemStatus.mockImplementation(fetchSystemStatusMock);
    postAuthMock = jest.fn(() => () => Promise.resolve());
    postAuth.mockImplementation(postAuthMock);
    clearAuthMock = jest.fn(() => () => Promise.resolve());
    clearAuth.mockImplementation(clearAuthMock);
    navigate = jest.fn();
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);

    store = mockStore({ data: { eula: { eula_url: '' } }, view: { systemConfig: {} } });

    render(
      <Provider store={store}>
        <NavigationWrapper>
          <Login />
        </NavigationWrapper>
      </Provider>
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('navigates to map after a successful login', async () => {
    expect(navigate).toHaveBeenCalledTimes(0);

    const formSubmitButton = await screen.findByRole('button');
    userEvent.click(formSubmitButton);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith({ pathname: '/', search: '' });
    });
  });
});