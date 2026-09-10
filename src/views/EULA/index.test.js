import React from 'react';
import { Provider } from 'react-redux';
import { useLocation } from 'react-router';
import userEvent from '@testing-library/user-event';

import { acceptEula, fetchEula } from '../../ducks/eula';
import { APP_ROUTES } from '../../constants/routes';
import { clearAuth } from '../../ducks/auth';
import { fetchCurrentUser } from '../../ducks/user';
import { mockStore } from '../../__test-helpers/MockStore';
import { render, screen, waitFor } from '../../test-utils';
import useNavigate from '../../hooks/useNavigate';

import EulaPage from './';

jest.mock('../../ducks/eula', () => ({
  ...jest.requireActual('../../ducks/eula'),
  acceptEula: jest.fn(),
  fetchEula: jest.fn(),
}));

jest.mock('../../ducks/auth', () => ({
  ...jest.requireActual('../../ducks/auth'),
  clearAuth: jest.fn(),
}));

jest.mock('../../ducks/user', () => ({
  ...jest.requireActual('../../ducks/user'),
  fetchCurrentUser: jest.fn(),
}));

jest.mock('../../hooks/useNavigate', () => jest.fn());

const LocationDisplay = () => {
  const location = useLocation();

  return <div data-testid="location">{location.pathname}</div>;
};

describe('EulaPage', () => {
  let navigate, store;
  beforeEach(() => {
    navigate = jest.fn();

    clearAuth.mockImplementation(() => () => Promise.resolve());
    fetchEula.mockImplementation(() => () => Promise.resolve());
    acceptEula.mockImplementation(() => () => Promise.resolve());
    fetchCurrentUser.mockImplementation(() => () => Promise.resolve());
    useNavigate.mockImplementation(() => navigate);

    store = mockStore({
      data: {
        eula: { id: 'eula1', eula_url: 'https://example.com/eula.pdf', version: '1.0' },
        user: { id: 'user1', accepted_eula: false },
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderEulaPage = (initialEntries) => render(
    <Provider store={store}>
      <EulaPage />
      <LocationDisplay />
    </Provider>,
    { initialEntries },
  );

  const acceptTheEula = async () => {
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Accept' }));
  };

  test('navigates to login when the post-accept session check fails, without redirecting into the app', async () => {
    fetchCurrentUser
      .mockImplementationOnce(() => () => Promise.resolve())
      .mockImplementationOnce(() => () => Promise.reject(new Error('session expired')));

    renderEulaPage([{ pathname: '/eula', state: { from: '/patrols' } }]);

    await acceptTheEula();

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({ pathname: APP_ROUTES.LOGIN, search: '' });
    });
    expect(screen.getByTestId('location')).toHaveTextContent('/eula');
  });

  test('navigates back to the originally intended route when the post-accept session check succeeds', async () => {
    renderEulaPage([{ pathname: '/eula', state: { from: '/patrols' } }]);

    await acceptTheEula();

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/patrols');
    });
    expect(navigate).not.toHaveBeenCalled();
  });
});
