import React from 'react';
import { act, render } from '@testing-library/react';

import { Provider } from 'react-redux';

import { mockStore } from '../__test-helpers/MockStore';

import GeoLocationWatcher from './';

import { USER_LOCATION_RETRIEVED } from '../ducks/location';

const mockUserLocation = {
  coords: {
    latitude: 20.567754,
    longitude: -103.394625,
  }
};


describe('The GeoLocationWatcher', () => {
  let store;

  beforeEach(() => {
    store = mockStore({ view: { userLocation: null }, data: { user: { } } });
    const mockGeolocation = {
      clearWatch: jest.fn(),
      getCurrentPosition: jest.fn().mockReturnValue(mockUserLocation),
      watchPosition: jest.fn().mockImplementation((updateFn, _errorFn) => {
        updateFn(mockUserLocation);
      }),
    };

    global.navigator.permissions = {
      query: jest.fn().mockReturnValue(Promise.resolve({ state: 'granted', addEventListener: jest.fn(), removeEventListener: jest.fn() })),
    };

    global.navigator.geolocation = mockGeolocation;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('checking if geolocation permission has been granted', () => {
    render(<Provider store={store}>
      <GeoLocationWatcher />
    </Provider>);

    expect(global.navigator.permissions.query).toHaveBeenCalledWith({ name: 'geolocation' });
  });

  /*   test('updating a user\'s location in the store when it changes', async () => {
    render(<Provider store={store}>
      <GeoLocationWatcher />
    </Provider>);

    await new Promise(process.nextTick);

    expect(global.navigator.geolocation.watchPosition).toHaveBeenCalled();

    await new Promise(process.nextTick);

    const actions = store.getActions();

    expect(actions).toEqual([{
      type: USER_LOCATION_RETRIEVED,
      payload: mockUserLocation,
    }]);

  });
 */
  test('handling errors', () => {

  });
});
