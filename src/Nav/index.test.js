import React from 'react';
import { Provider } from 'react-redux';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { createMapMock } from '../__test-helpers/mocks';
import { clearUserProfile, USER_API_URL, CURRENT_USER_API_URL, USER_PROFILES_API_URL } from '../ducks/user';
import { cleanup, fireEvent, render, screen, waitFor } from '../test-utils';
import { NEWS_API_URL } from '../ducks/news';
import { userWithPin, userWithoutPin, userWithoutEula, userList } from '../__test-helpers/fixtures/users';

import store from '../store';
import { MapContext } from '../App';
import Nav from './';
import ModalRenderer from '../ModalRenderer';
import useNavigate from '../hooks/useNavigate';
jest.mock('../hooks/useNavigate', () => jest.fn());

const generateResponse = (data = []) => ({ data });

const anotherPinProfile = userWithoutEula;

const server = setupServer(
  rest.get(`${USER_API_URL}/:userId`, (req, res, ctx) => {
    const { userId } = req.params;
    const userMatch = userList.find(user => user.id === userId);

    return res(
      ctx.json(
        generateResponse(userMatch)
      )
    );
  }),
  rest.get(CURRENT_USER_API_URL, (req, res, ctx) => {
    return res(
      ctx.json(
        generateResponse(
          userWithPin,
        )
      )
    );
  }),
  rest.get(USER_PROFILES_API_URL, (req, res, ctx) => {
    return res(
      ctx.json(
        generateResponse(
          userList.filter(user => user.id !== userWithPin.id)
        ),
      )
    );
  }),
  rest.get(NEWS_API_URL, (req, res, ctx) => {
    return res(
      ctx.json(
        generateResponse(),
      )
    );
  }),
);

beforeAll(() => server.listen());
beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  server.resetHandlers();
  store.dispatch(clearUserProfile());
  jest.useRealTimers();
});
afterAll(() => server.close());

describe('the Nav component', () => {
  let map, navigate, useNavigateMock;
  beforeEach(() => {
    navigate = jest.fn();
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
      rest.get(CURRENT_USER_API_URL, (req, res, ctx) => {
        return res.once(
          ctx.status(403
          ));
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
    let reloadMock, userToggleBtn;

    beforeEach(async () => {
      reloadMock = jest.fn();

      delete window.location;
      window.location = { reload: jest.fn() };

      window.localStorage.setItem('persist:userProfile', '{"username":""profile""}');
      window.location.reload = reloadMock;

      userToggleBtn = await screen.findByTestId('user-menu-toggle-btn');

      userToggleBtn.click();

    });
    test('selecting a non-PIN-protected profile', async () => {
      const nonPinProfileLink = await screen.getByRole('button', {
        name: userWithoutPin.username,
      });

      nonPinProfileLink.click();

      const state = store.getState();

      expect(state.data.selectedUserProfile).toEqual(userWithoutPin);

      jest.advanceTimersByTime(500);

      expect(reloadMock).toHaveBeenCalled();
    });

    test('selecting a PIN-protected profile', async () => {
      let pinInputs, state;
      const profileProtectedLink = await screen.getByRole('button', {
        name: anotherPinProfile.username,
      });

      profileProtectedLink.click();

      state = store.getState();

      expect(state.data.selectedUserProfile).not.toEqual(anotherPinProfile);

      await screen.findByText('Enter Your PIN');
      pinInputs = await screen.findAllByRole('input');

      const splitPin = anotherPinProfile.pin.split('');

      splitPin.forEach((char, index) => {
        fireEvent.keyDown(pinInputs[index], { key: char, code: `key${char}` });
      });

      state = store.getState();

      expect(state.data.selectedUserProfile).toEqual(anotherPinProfile);

      jest.advanceTimersByTime(500);

      expect(reloadMock).toHaveBeenCalled();
    });

    test('does not redirect until the profile is persisted', async () => {
      window.localStorage.removeItem('persist:userProfile');
      const nonPinProfileLink = await screen.getByRole('button', {
        name: userWithoutPin.username,
      });
      nonPinProfileLink.click();

      const state = store.getState();

      expect(state.data.selectedUserProfile).toEqual(userWithoutPin);

      jest.advanceTimersByTime(500);

      expect(reloadMock).not.toHaveBeenCalled();

      window.localStorage.setItem('persist:userProfile', '{"username":""profile""}');

      jest.advanceTimersByTime(500);

      expect(reloadMock).toHaveBeenCalled();
    });
  });
});

