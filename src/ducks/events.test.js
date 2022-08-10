import axios from 'axios';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { createMapMock } from '../__test-helpers/mocks';
import { mockStore } from '../__test-helpers/MockStore';

import { fetchMapEvents, EVENTS_API_URL } from './events';

describe.skip('fetchMapEvents', () => {
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
  test('appending parameters when passed', async () => {
    store = mockStore({ data: { mapEvents: { bbox: '1,2,3,4' } }, view: { userLocation: { coords: { longitude: 1, latitude: 2 } }, systemConfig: { geoPermissionsEnabled: true } } });

    jest.spyOn(axios, 'get').mockImplementationOnce(() => Promise.resolve());

    const PARAM_NAME = 'location';

    await store.dispatch(fetchMapEvents(map, { [PARAM_NAME]: 'latitude=whatever,longitude=neato' }));

    expect(axios.get).toHaveBeenCalledTimes(1);

    expect(axios.get.mock.calls[0][0].includes(PARAM_NAME)).toBeTruthy();
  });
  test('handling 403 Forbidden errors for geo-permission-restricted users', () => {
    const server = setupServer(
      rest.get(EVENTS_API_URL, (req, res, ctx) => {
        return res(
          ctx.status(403),
          ctx.json({
            errorMessage: 'Geo-permissions required to access this data',
          }),
        );
      })
    );

    server.listen();


    server.close();
  });
});
