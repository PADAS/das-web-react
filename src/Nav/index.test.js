import { http, HttpResponse } from 'msw/http';
import { Provider } from 'react-redux';
import { setupServer } from 'msw/node';
import userEvent from '@testing-library/user-event';

import { createMapMock } from '../__test-helpers/mocks';
import { clearModals } from '../ducks/modals';
import { clearUserProfile, USER_API_URL, CURRENT_USER_API_URL, USER_PROFILES_API_URL } from '../ducks/user';
import { hideDrawer } from '../ducks/drawer';
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
  http.get(CURRENT_USER_API_URL, () => HttpResponse.json(generateResponse(userWithPin))),
  http.get(`${USER_API_URL}/:userId`, ({ params }) => HttpResponse.json(
    generateResponse(userList.find((user) => user.id === params.userId))
  )),
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
  store.dispatch(clearModals());
  store.dispatch(clearUserProfile());
  store.dispatch(hideDrawer());
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
    await waitFor(() => expect(store.getState().data.user).not.toEqual({}));

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

  test('opens the main menu from a button that names it and reports it expanded', async () => {
    const globalMenuButton = screen.getByRole('button', { name: 'Open main menu' });

    expect(globalMenuButton).toHaveAttribute('title', 'Open main menu');
    expect(globalMenuButton).toHaveAttribute('aria-haspopup', 'dialog');
    expect(globalMenuButton).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(globalMenuButton);

    expect(globalMenuButton).toHaveAttribute('aria-expanded', 'true');
  });

  describe('changing profiles', () => {
    beforeEach(async () => {
      window.localStorage.setItem('persist:userProfile', '{"username":""profile""}');

      await userEvent.click(await screen.findByRole('button', { name: /^User settings:/ }));

      await screen.findByRole('menu', { name: 'User settings' });
    });

    test('reloads as the profile the user selects when it has no PIN', async () => {
      jest.useFakeTimers();
      const nonPinProfileLink = screen.getByRole('menuitemradio', { name: userWithoutPin.username });

      nonPinProfileLink.click();

      const state = store.getState();

      expect(state.data.selectedUserProfile).toEqual(userWithoutPin);

      jest.advanceTimersByTime(500);

      expect(reload).toHaveBeenCalled();

      jest.useRealTimers();
    });

    test('asks for the PIN of a protected profile before reloading as it', async () => {
      jest.useFakeTimers();

      let pinInputs, state;
      const profileProtectedLink = screen.getByRole('menuitemradio', { name: anotherPinProfile.username });

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

    test('does not reload until the selected profile is persisted', async () => {
      jest.useFakeTimers();

      window.localStorage.removeItem('persist:userProfile');
      const nonPinProfileLink = screen.getByRole('menuitemradio', { name: userWithoutPin.username });
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

    test('does not reload as the main user until the profile is cleared from storage', async () => {
      const mainUserOption = await screen.findByRole('menuitemradio', { name: userWithPin.username });

      jest.useFakeTimers();

      mainUserOption.click();

      const pinInputs = await screen.findAllByRole('input');
      const user = userEvent.setup({ delay: null });

      await user.type(pinInputs[0], userWithPin.pin[0]);
      await user.type(pinInputs[1], userWithPin.pin[1]);
      await user.type(pinInputs[2], userWithPin.pin[2]);
      await user.type(pinInputs[3], userWithPin.pin[3]);

      jest.advanceTimersByTime(500);

      expect(reload).not.toHaveBeenCalled();

      window.localStorage.removeItem('persist:userProfile');

      jest.advanceTimersByTime(500);

      expect(reload).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });
});
