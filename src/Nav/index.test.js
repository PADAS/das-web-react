import { http, HttpResponse } from 'msw/http';
import { Provider } from 'react-redux';
import { setupServer } from 'msw/node';
import userEvent from '@testing-library/user-event';

import { act, cleanup, render, screen, waitFor } from '../test-utils';
import { BREAKPOINTS, MAX_ZOOM } from '../constants';
import { clearModals } from '../ducks/modals';
import { clearUserProfile, CURRENT_USER_API_URL, USER_API_URL, USER_PROFILES_API_URL } from '../ducks/user';
import { createMapMock } from '../__test-helpers/mocks';
import { FETCH_MAPS_SUCCESS, setHomeMap } from '../ducks/maps';
import getWindowLocation from '../utils/getWindowLocation';
import { hideDrawer } from '../ducks/drawer';
import { MapContext } from '../MapContext';
import { NEWS_API_URL } from '../ducks/news';
import { setCurrentUserLocation } from '../ducks/location';
import store from '../store';
import * as toastUtils from '../utils/toast';
import useNavigate from '../hooks/useNavigate';
import { userList, userWithoutEula, userWithoutPin, userWithPin } from '../__test-helpers/fixtures/users';

import ModalRenderer from '../ModalRenderer';

import Nav from './';

jest.mock('../hooks/useNavigate', () => jest.fn());

jest.mock('../utils/getWindowLocation', () => jest.fn());

const mockTrack = jest.fn();
jest.mock('../utils/analytics', () => ({
  ...jest.requireActual('../utils/analytics'),
  trackEventFactory: () => ({ track: (...args) => mockTrack(...args) }),
}));

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

  const renderNav = () => render(<Provider store={store}>
    <MapContext.Provider value={map}>
      <Nav map={map} />
      <ModalRenderer />
    </MapContext.Provider>
  </Provider>);

  beforeEach(() => {
    navigate = jest.fn();
    getWindowLocation.mockImplementation(() => ({ reload }));
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);
    map = createMapMock();

    renderNav();
  });

  afterEach(() => {
    BREAKPOINTS.screenIsMediumLayoutOrLarger.matches = true;

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
    renderNav();

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

  test('shows the notifications button on medium screens and up', async () => {
    expect(await screen.findByRole('button', { name: /^Notifications/ })).toBeInTheDocument();
  });

  test('does not show the notifications button on small screens', async () => {
    BREAKPOINTS.screenIsMediumLayoutOrLarger.matches = false;

    cleanup();
    renderNav();

    expect(await screen.findByRole('button', { name: /^User settings:/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Notifications/ })).not.toBeInTheDocument();
  });

  test('shows the system status in the right section of the top bar on medium screens and up', () => {
    expect(screen.getByRole('banner').lastElementChild)
      .toContainElement(screen.getByRole('button', { name: /^System status:/ }));
  });

  test('shows the system status in the left section of the top bar on small screens', () => {
    BREAKPOINTS.screenIsMediumLayoutOrLarger.matches = false;

    cleanup();
    renderNav();

    expect(screen.getByRole('banner').firstElementChild)
      .toContainElement(screen.getByRole('button', { name: /^System status:/ }));
  });

  describe('map quick links', () => {
    const park = { center: [1, 1], id: 'park', name: 'park', title: 'National Park', zoom: 9 };
    const reserve = { center: [2, 2], id: 'reserve', name: 'Game Reserve', zoom: 8 };

    beforeEach(() => {
      mockTrack.mockClear();

      act(() => {
        store.dispatch({ payload: [reserve, park], type: FETCH_MAPS_SUCCESS });
        store.dispatch(setHomeMap(reserve));
      });
    });

    afterEach(() => {
      act(() => {
        store.dispatch({ payload: [], type: FETCH_MAPS_SUCCESS });
        store.dispatch(setCurrentUserLocation(null));
        store.dispatch(setHomeMap(null));
      });
    });

    test('jumps to the selected link from the main button and tracks it by its displayed title', async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Jump to Game Reserve' }));

      expect(map.easeTo).toHaveBeenCalledWith(expect.objectContaining({ center: [2, 2], zoom: 8 }));
      expect(store.getState().view.homeMap).toEqual(reserve);
      expect(mockTrack).toHaveBeenCalledWith('Jump to Home Area', 'Home Area:Game Reserve');
    });

    test('jumps to a link picked from the menu, selects it and tracks it by its displayed title', async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Choose a map quick link' }));
      await userEvent.click(await screen.findByRole('menuitemradio', { name: 'National Park' }));

      expect(map.easeTo).toHaveBeenCalledWith(expect.objectContaining({ center: [1, 1], zoom: 9 }));
      expect(store.getState().view.homeMap).toEqual(park);
      expect(screen.getByRole('button', { name: 'Jump to National Park' })).toBeInTheDocument();
      expect(mockTrack).toHaveBeenCalledWith('Change Home Area', 'Home Area:National Park');
    });

    test('flies to the user location picked from the menu instead of easing there', async () => {
      act(() => {
        store.dispatch(setCurrentUserLocation({ coords: { latitude: 20.65, longitude: -103.4 } }));
      });

      await userEvent.click(screen.getByRole('button', { name: 'Choose a map quick link' }));
      await userEvent.click(await screen.findByRole('menuitem', { name: 'My Current Location' }));

      expect(map.flyTo).toHaveBeenCalledWith(expect.objectContaining({ center: [-103.4, 20.65], zoom: MAX_ZOOM - 2 }));
      expect(map.easeTo).not.toHaveBeenCalled();
    });
  });

  describe('changing profiles', () => {
    beforeEach(async () => {
      window.localStorage.setItem('persist:userProfile', '{"username":""profile""}');

      await userEvent.click(await screen.findByRole('button', { name: /^User settings:/ }));

      await screen.findByRole('menu', { name: 'User settings' });
    });

    test('reloads as the full record of the profile the user selects when it has no PIN', async () => {
      const profileRecord = { ...userWithoutPin, permissions: { patrol: ['view'] } };
      const profileHeaders = [];
      server.use(http.get(`${USER_API_URL}/${userWithoutPin.id}`, ({ request }) => {
        profileHeaders.push(request.headers.get('USER-PROFILE'));

        return HttpResponse.json(generateResponse(profileRecord));
      }));
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });

      await user.click(screen.getByRole('menuitemradio', { name: userWithoutPin.username }));

      await waitFor(() => expect(store.getState().data.selectedUserProfile).toEqual(profileRecord));
      expect(profileHeaders).toEqual([userWithoutPin.id]);

      jest.advanceTimersByTime(500);

      expect(reload).toHaveBeenCalled();

      jest.useRealTimers();
    });

    test('stays as the current user and says so when the selected profile cannot be read', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      jest.spyOn(toastUtils, 'showToast').mockImplementation(() => {});
      server.use(http.get(`${USER_API_URL}/${userWithoutPin.id}`, () => HttpResponse.json(null, { status: 500 })));
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });

      await user.click(screen.getByRole('menuitemradio', { name: userWithoutPin.username }));

      await waitFor(() => expect(toastUtils.showToast).toHaveBeenCalledWith({
        message: `Could not switch to the profile ${userWithoutPin.username}. Please try again.`,
      }));

      jest.advanceTimersByTime(500);

      expect(store.getState().data.selectedUserProfile).toEqual({});
      expect(reload).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    test('closes the PIN prompt when the protected profile it unlocked cannot be read', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      jest.spyOn(toastUtils, 'showToast').mockImplementation(() => {});
      server.use(http.get(`${USER_API_URL}/${anotherPinProfile.id}`, () => HttpResponse.json(null, { status: 500 })));
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });

      await user.click(screen.getByRole('menuitemradio', { name: anotherPinProfile.username }));

      const pinInputs = await screen.findAllByRole('input');
      await user.type(pinInputs[0], anotherPinProfile.pin[0]);
      await user.type(pinInputs[1], anotherPinProfile.pin[1]);
      await user.type(pinInputs[2], anotherPinProfile.pin[2]);
      await user.type(pinInputs[3], anotherPinProfile.pin[3]);

      await waitFor(() => expect(toastUtils.showToast).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(screen.queryByText('Enter Your PIN')).not.toBeInTheDocument());
      expect(store.getState().data.selectedUserProfile).toEqual({});

      jest.useRealTimers();
    });

    test('cancels a loading profile pick as soon as the user picks a protected profile', async () => {
      jest.spyOn(toastUtils, 'showToast').mockImplementation(() => {});
      let isProfileReadCancelled, releaseProfileRead;
      const profileReadGate = new Promise((resolve) => {
        releaseProfileRead = resolve;
      });
      server.use(http.get(`${USER_API_URL}/${userWithoutPin.id}`, async ({ request }) => {
        await profileReadGate;
        isProfileReadCancelled = request.signal.aborted;

        return HttpResponse.json(generateResponse(userWithoutPin));
      }));
      const user = userEvent.setup({ delay: null });

      await user.click(screen.getByRole('menuitemradio', { name: userWithoutPin.username }));
      await waitFor(() => expect(screen.queryByRole('menu', { name: 'User settings' })).not.toBeInTheDocument());
      await user.click(screen.getByRole('button', { name: /^User settings:/ }));
      await user.click(await screen.findByRole('menuitemradio', { name: userWithPin.username }));

      const pinInputs = await screen.findAllByRole('input');
      releaseProfileRead();
      await waitFor(() => expect(isProfileReadCancelled).toBe(true));

      expect(store.getState().data.selectedUserProfile).toEqual({});

      jest.useFakeTimers();
      await user.type(pinInputs[0], userWithPin.pin[0]);
      await user.type(pinInputs[1], userWithPin.pin[1]);
      await user.type(pinInputs[2], userWithPin.pin[2]);
      await user.type(pinInputs[3], userWithPin.pin[3]);

      await waitFor(() => expect(screen.queryByText('Enter Your PIN')).not.toBeInTheDocument());
      jest.advanceTimersByTime(500);

      expect(store.getState().data.selectedUserProfile).toEqual({});
      expect(toastUtils.showToast).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    test('cancels a loading profile pick when the user logs out', async () => {
      jest.spyOn(toastUtils, 'showToast').mockImplementation(() => {});
      let isProfileReadCancelled, releaseProfileRead;
      const profileReadGate = new Promise((resolve) => {
        releaseProfileRead = resolve;
      });
      server.use(http.get(`${USER_API_URL}/${userWithoutPin.id}`, async ({ request }) => {
        await profileReadGate;
        isProfileReadCancelled = request.signal.aborted;

        return HttpResponse.json(generateResponse(userWithoutPin));
      }));
      const user = userEvent.setup({ delay: null });

      await user.click(screen.getByRole('menuitemradio', { name: userWithoutPin.username }));
      await waitFor(() => expect(screen.queryByRole('menu', { name: 'User settings' })).not.toBeInTheDocument());
      await user.click(screen.getByRole('button', { name: /^User settings:/ }));
      await user.click(await screen.findByRole('menuitem', { name: 'Log out' }));

      releaseProfileRead();
      await waitFor(() => expect(isProfileReadCancelled).toBe(true));
      await waitFor(() => expect(navigate).toHaveBeenCalledWith({ pathname: '/login' }, { replace: true }));

      expect(store.getState().data.selectedUserProfile).toEqual({});
      expect(toastUtils.showToast).not.toHaveBeenCalled();
    });

    test('cancels the read of an unlocked profile when the user closes the PIN prompt', async () => {
      jest.spyOn(toastUtils, 'showToast').mockImplementation(() => {});
      let isProfileReadCancelled, releaseProfileRead;
      const profileReadGate = new Promise((resolve) => {
        releaseProfileRead = resolve;
      });
      server.use(http.get(`${USER_API_URL}/${anotherPinProfile.id}`, async ({ request }) => {
        await profileReadGate;
        isProfileReadCancelled = request.signal.aborted;

        return HttpResponse.json(generateResponse(anotherPinProfile));
      }));
      const user = userEvent.setup({ delay: null });

      await user.click(screen.getByRole('menuitemradio', { name: anotherPinProfile.username }));

      const pinInputs = await screen.findAllByRole('input');
      await user.type(pinInputs[0], anotherPinProfile.pin[0]);
      await user.type(pinInputs[1], anotherPinProfile.pin[1]);
      await user.type(pinInputs[2], anotherPinProfile.pin[2]);
      await user.type(pinInputs[3], anotherPinProfile.pin[3]);
      await user.click(screen.getByRole('button', { name: 'Close' }));

      releaseProfileRead();
      await waitFor(() => expect(isProfileReadCancelled).toBe(true));

      expect(screen.queryByText('Enter Your PIN')).not.toBeInTheDocument();
      expect(store.getState().data.selectedUserProfile).toEqual({});
      expect(toastUtils.showToast).not.toHaveBeenCalled();
      expect(reload).not.toHaveBeenCalled();
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

      await waitFor(() => expect(store.getState().data.selectedUserProfile).toEqual(anotherPinProfile));

      jest.advanceTimersByTime(500);

      expect(reload).toHaveBeenCalled();

      jest.useRealTimers();
    });

    test('does not reload until the selected profile is persisted', async () => {
      jest.useFakeTimers();

      window.localStorage.removeItem('persist:userProfile');
      const nonPinProfileLink = screen.getByRole('menuitemradio', { name: userWithoutPin.username });
      nonPinProfileLink.click();

      await waitFor(() => expect(store.getState().data.selectedUserProfile).toEqual(userWithoutPin));

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
