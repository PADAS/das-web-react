import React from 'react';
import { Provider } from 'react-redux';
import { render, waitFor } from '@testing-library/react';

import { fetchCurrentUser } from '../ducks/user';
import { fetchSystemStatus } from '../ducks/system-status';
import { mockStore } from '../__test-helpers/MockStore';
import NavigationWrapper from '../__test-helpers/navigationWrapper';
import { SYSTEM_CONFIG_FLAGS } from '../constants';
import useNavigate from '../hooks/useNavigate';

import RequireEulaConfirmation from './';

jest.mock('../ducks/user', () => ({
  ...jest.requireActual('../ducks/user'),
  fetchCurrentUser: jest.fn(),
}));

jest.mock('../ducks/system-status', () => ({
  ...jest.requireActual('../ducks/system-status'),
  fetchSystemStatus: jest.fn(),
}));

jest.mock('../hooks/useNavigate', () => jest.fn());

describe('RequireEulaConfirmation', () => {
  let fetchCurrentUserMock, fetchSystemStatusMock, navigate, store, useNavigateMock;
  beforeEach(() => {
    fetchCurrentUserMock = jest.fn(() => () => Promise.resolve());
    fetchCurrentUser.mockImplementation(fetchCurrentUserMock);
    fetchSystemStatusMock = jest.fn(() => () => Promise.resolve());
    fetchSystemStatus.mockImplementation(fetchSystemStatusMock);
    navigate = jest.fn();
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);

    store = mockStore({
      data: {
        user: {},
      },
      view: {
        systemConfig: {
          [SYSTEM_CONFIG_FLAGS.EULA]: false,
        },
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('redirects to login is can not fetch current user', async () => {
    fetchCurrentUserMock = jest.fn(() => () => Promise.reject());
    fetchCurrentUser.mockImplementation(fetchCurrentUserMock);

    render(
      <Provider store={store}>
        <NavigationWrapper>
          <RequireEulaConfirmation />
        </NavigationWrapper>
      </Provider>
    );

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith({ pathname: '/login', search: '' });
    });
  });
});