import React from 'react';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';
import { setupServer } from 'msw/node';
import userEvent from '@testing-library/user-event';

import { createMapMock } from '../__test-helpers/mocks';
import { clearUserProfile, USER_API_URL, CURRENT_USER_API_URL, USER_PROFILES_API_URL } from '../ducks/user';
import { cleanup, render, screen, waitFor } from '../test-utils';
import getWindowLocation from '../utils/getWindowLocation';
import { NEWS_API_URL } from '../ducks/news';
import { userWithPin, userWithoutPin, userWithoutEula, userList } from '../__test-helpers/fixtures/users';

import store from '../store';
import { MapContext } from '../MapContext';
import Nav from './';
import ModalRenderer from '../ModalRenderer';
import useNavigate from '../hooks/useNavigate';
jest.mock('../hooks/useNavigate', () => jest.fn());

jest.mock('../utils/getWindowLocation', () => jest.fn());

const generateResponse = (data = []) => ({ data });

const anotherPinProfile = userWithoutEula;

const server = setupServer(
  http.get(`${USER_API_URL}/:userId`, ({ params }) => {
    const { userId } = params;
    const userMatch = userList.find(user => user.id === userId);

    return HttpResponse.json(generateResponse(userMatch));
  }),
  http.get(CURRENT_USER_API_URL, () => {
    return HttpResponse.json(generateResponse(userWithPin));
  }),
  http.get(USER_PROFILES_API_URL, () => {
    return HttpResponse.json(generateResponse(userList.filter(user => user.id !== userWithPin.id)));
  }),
  http.get(NEWS_API_URL, () => {
    return HttpResponse.json(generateResponse());
  }),
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  store.dispatch(clearUserProfile());
});
afterAll(() => server.close());

describe('the Nav component', () => {
  const reload = jest.fn();

  let map, navigate, useNavigateMock;
  beforeEach(() => {
    navigate = jest.fn();
    getWindowLocation.mockImplementation(() => ({ reload }));
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);
    map = createMapMock();

    render(
      <Provider store={store}>
        <MapContext.Provider value={map}>
          <Nav map={map} />
          <ModalRenderer />
        </MapContext.Provider>
      </Provider>
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('navigates to login if can not fetch the current user', async () => {
    server.use(
      http.get(CURRENT_USER_API_URL, () => {
        return HttpResponse.json(null, { status: 403 });
      })
    );

    cleanup();
    render(
      <Provider store={store}>
        <MapContext.Provider value={map}>
          <Nav map={map} />
          <ModalRenderer />
        </MapContext.Provider>
      </Provider>
    );

    expect(navigate).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith({ pathname: '/login', search: '' });
    });
  });
  describe('changing profiles', () => {
    let userToggleBtn;

    beforeEach(async () => {
      window.localStorage.setItem('persist:userProfile', '{"username":""profile""}');

      userToggleBtn = await screen.findByTestId('user-menu-toggle-btn');

      userToggleBtn.click();

    });
    test('selecting a non-PIN-protected profile', async () => {
      jest.useFakeTimers();
      const nonPinProfileLink = await screen.getByRole('button', {
        name: userWithoutPin.username,
      });

      nonPinProfileLink.click();

      const state = store.getState();

      expect(state.data.selectedUserProfile).toEqual(userWithoutPin);

      jest.advanceTimersByTime(500);

      expect(reload).toHaveBeenCalled();

      jest.useRealTimers();
    });

    test('selecting a PIN-protected profile', async () => {
      jest.useFakeTimers();

      let pinInputs, state;
      const profileProtectedLink = await screen.getByRole('button', {
        name: anotherPinProfile.username,
      });

      profileProtectedLink.click();

      state = store.getState();

      expect(state.data.selectedUserProfile).not.toEqual(anotherPinProfile);

      await screen.findByText('Enter Your PIN');
      pinInputs = await screen.findAllByRole('input');

      const user = userEvent.setup({ delay: null });

      await user.type(pinInputs[0], anotherPinProfile.pin[0]);
      await user.type(pinInputs[1], anotherPinProfile.pin[1]);
      await user.type(pinInputs[2], anotherPinProfile.pin[2]);
      await user.type(pinInputs[3], anotherPinProfile.pin[3]);

      state = store.getState();

      expect(state.data.selectedUserProfile).toEqual(anotherPinProfile);

      jest.advanceTimersByTime(500);

      expect(reload).toHaveBeenCalled();

      jest.useRealTimers();
    });

    test('does not redirect until the profile is persisted', async () => {
      jest.useFakeTimers();

      window.localStorage.removeItem('persist:userProfile');
      const nonPinProfileLink = await screen.getByRole('button', {
        name: userWithoutPin.username,
      });
      nonPinProfileLink.click();

      const state = store.getState();

      expect(state.data.selectedUserProfile).toEqual(userWithoutPin);

      jest.advanceTimersByTime(500);

      expect(reload).not.toHaveBeenCalled();

      window.localStorage.setItem('persist:userProfile', '{"username":""profile""}');

      jest.advanceTimersByTime(500);

      expect(reload).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });
});

