import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
    store = mockStore({ view: { userLocation: null } });
    const mockGeolocation = {
      clearWatch: jest.fn(),
      getCurrentPosition: jest.fn().mockReturnValue(mockUserLocation),
      watchPosition: jest.fn().mockImplementation((updateFn, _errorFn) => {
        updateFn(mockUserLocation);
      }),
    };

    global.navigator.geolocation = mockGeolocation;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('attempting to watch the user\'s position at startup', () => {
    render(
      <Provider store={store}>
        <GeoLocationWatcher />
      </Provider>
    );

    expect(global.navigator.geolocation.watchPosition).toHaveBeenCalled();

    const actions = store.getActions();
    const expectedPayload = { type: 'USER_LOCATION_RETRIEVED', payload: mockUserLocation };
    expect(actions).toEqual([expectedPayload]);
  });

  test('updating a user\'s location in the store when it changes', () => {
    render(<Provider store={store}>
      <GeoLocationWatcher />
    </Provider>);

    expect(global.navigator.geolocation.watchPosition).toHaveBeenCalled();

    const actions = store.getActions();

    expect(actions).toEqual([{
      type: USER_LOCATION_RETRIEVED,
      payload: mockUserLocation,
    }]);

  });

  test('handling errors', () => {

  });
});
