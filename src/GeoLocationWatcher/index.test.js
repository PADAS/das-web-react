import React from 'react';

import { Provider } from 'react-redux';
import { toast } from 'react-toastify';

import { mockStore } from '../__test-helpers/MockStore';
import { render, waitFor } from '../test-utils';

import GeoLocationWatcher from './';

import { USER_LOCATION_RETRIEVED } from '../ducks/location';

const mockUserLocation = {
  coords: {
    latitude: 20.567754,
    longitude: -103.394625,
  }
};


describe('The GeoLocationWatcher', () => {
  let permissionStatus, reduxStore, store;

  beforeEach(() => {
    store = {
      data: { user: { id: 'user-id' } },
      view: { userLocation: null, userLocationAccessGranted: { granted: true } },
    };

    const mockGeolocation = {
      clearWatch: jest.fn(),
      getCurrentPosition: jest.fn().mockImplementation((successFn) => successFn && successFn(mockUserLocation)),
      watchPosition: jest.fn().mockImplementation((updateFn, _errorFn) => {
        updateFn(mockGeolocation.getCurrentPosition());
      }),
    };

    global.navigator.geolocation = mockGeolocation;

    permissionStatus = {
      addEventListener: jest.fn()
        .mockImplementation((_eventType, callback) => {
          callback({ target: { state: 'granted' } });
        }),
      removeEventListener: jest.fn(),
      state: 'granted',
    };

    global.navigator.permissions = { query: jest.fn().mockResolvedValue(permissionStatus) };
  });

  const renderGeoLocationWatcher = (props) => {
    reduxStore = mockStore(store);

    return render(<Provider store={reduxStore}>
      <GeoLocationWatcher {...props} />
    </Provider>);
  };

  test('checking if geolocation permission has been granted', () => {
    renderGeoLocationWatcher();

    expect(global.navigator.permissions.query).toHaveBeenCalledWith({ name: 'geolocation' });
  });

  test('updating a user\'s location in the store when it changes', async () => {
    renderGeoLocationWatcher();

    await waitFor(() => {
      expect(global.navigator.geolocation.watchPosition).toHaveBeenCalled();
    });

    const actions = reduxStore.getActions();

    expect(actions[0].type).toEqual(USER_LOCATION_RETRIEVED);
  });

  test('does not read the position while the permission is still to be asked', async () => {
    permissionStatus.state = 'prompt';
    store.view.userLocationAccessGranted = { granted: false };
    renderGeoLocationWatcher();

    await waitFor(() => expect(global.navigator.permissions.query).toHaveBeenCalled());

    expect(global.navigator.geolocation.getCurrentPosition).not.toHaveBeenCalled();
    expect(global.navigator.geolocation.watchPosition).not.toHaveBeenCalled();
  });

  test('does not read the position or check the permission until a user is loaded', () => {
    store.data.user = {};
    store.view.userLocationAccessGranted = { granted: false };
    renderGeoLocationWatcher();

    expect(global.navigator.permissions.query).not.toHaveBeenCalled();
    expect(global.navigator.geolocation.getCurrentPosition).not.toHaveBeenCalled();
    expect(global.navigator.geolocation.watchPosition).not.toHaveBeenCalled();
  });

  test('reads the position once the permission is granted', async () => {
    renderGeoLocationWatcher();

    await waitFor(() => expect(global.navigator.geolocation.getCurrentPosition).toHaveBeenCalled());

    expect(global.navigator.geolocation.watchPosition).toHaveBeenCalled();
  });

  test('does not dismiss toasts when the permission resolves granted with no permissions toast showing', async () => {
    jest.spyOn(toast, 'dismiss');
    renderGeoLocationWatcher();

    await waitFor(() => expect(global.navigator.geolocation.getCurrentPosition).toHaveBeenCalled());

    expect(toast.dismiss).not.toHaveBeenCalled();
  });
});
