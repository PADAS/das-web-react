import axios from 'axios';

import { createMapMock } from '../__test-helpers/mocks';
import { mockStore } from '../__test-helpers/MockStore';

import { fetchMapEvents } from './events';
import * as queryUtils from '../utils/query';

describe('fetchMapEvents', () => {
  let map, store;

  beforeEach(() => {
    map = createMapMock();
    store = mockStore({ data: { }, view: { } });
  });

  test('appending a bbox parameter from the map object', async () => {
    jest.spyOn(axios, 'get').mockImplementationOnce(() => Promise.resolve());

    await store.dispatch(fetchMapEvents(map));

    expect(axios.get).toHaveBeenCalledTimes(1);


    expect(axios.get.mock.calls[0][0].includes('bbox')).toBeTruthy();

  });
  test('appending a bbox parameter from state if the map object is unavailable', async () => {
    jest.spyOn(axios, 'get').mockImplementationOnce(() => Promise.resolve());

    store = mockStore({ data: { mapEvents: { bbox: '1,2,3,4' } }, view: { } });

    await store.dispatch(fetchMapEvents(map));

    expect(axios.get).toHaveBeenCalledTimes(1);

    expect(axios.get.mock.calls[0][0].includes('bbox')).toBeTruthy();

  });
  test('rejecting the request if no bbox data is available', async () => {
    await store.dispatch(fetchMapEvents())
      .catch((error) => {
        expect(error).toEqual('no map available');
      });
  });
  test('appending a "location" parameter if geopermissions are enabled and a user location is available', () => {
    store = mockStore({ data: { mapEvents: { bbox: '1,2,3,4' }, geoPermissionsEnabled: true }, view: { userLocation: { longitutde: 1, latitude: 2 } } });
  });
  test('handling 403 Forbidden errors for geo-permission-restricted users', () => {

  });
});
