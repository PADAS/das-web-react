import { http, HttpResponse } from 'msw/http';
import { setupServer } from 'msw/node';

import { mockStore } from '../__test-helpers/MockStore';

import {
  FETCH_MAPS_SUCCESS,
  fetchMaps,
  homeMapReducer,
  INITIAL_HOME_MAP_STATE,
  INITIAL_MAPS_STATE,
  MAPS_API_URL,
  mapsReducer,
  SET_HOME_MAP,
  setHomeMap,
} from './maps';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ducks - maps', () => {
  const park = { center: [1, 1], id: 'park', name: 'park', title: 'National Park', zoom: 9 };
  const reserve = { center: [2, 2], id: 'reserve', name: 'Game Reserve', zoom: 8 };
  const sector2 = { center: [3, 3], default: true, id: 'sector-2', name: 'Sector 2', zoom: 10 };
  const sector10 = { center: [4, 4], id: 'sector-10', name: 'sector 10', zoom: 10 };

  let quickLinks;
  let store;

  beforeEach(() => {
    quickLinks = [sector10, park, sector2, reserve];
    store = mockStore({ view: { homeMap: null } });

    server.use(http.get(MAPS_API_URL, () => HttpResponse.json({ data: quickLinks })));
  });

  const getFetchedMaps = () => store.getActions().find((action) => action.type === FETCH_MAPS_SUCCESS)?.payload;

  const getSetHomeMaps = () => store.getActions()
    .filter((action) => action.type === SET_HOME_MAP)
    .map((action) => action.payload);

  describe('fetchMaps', () => {
    test('reads the quick links from the quick links endpoint', () => {
      expect(MAPS_API_URL).toMatch(/\/quicklinks\/$/);
    });

    test('lists the quick links by their displayed title, ignoring case and comparing numbers by value', async () => {
      await store.dispatch(fetchMaps());

      expect(getFetchedMaps()).toEqual([reserve, park, sector2, sector10]);
    });

    test('selects the default quick link when none is selected yet', async () => {
      await store.dispatch(fetchMaps());

      expect(getSetHomeMaps()).toEqual([sector2]);
    });

    test('selects the first quick link by title when none is selected yet and none is the default', async () => {
      quickLinks = [sector10, park, reserve];

      await store.dispatch(fetchMaps());

      expect(getSetHomeMaps()).toEqual([reserve]);
    });

    test('replaces a selected quick link that no longer exists with the default one', async () => {
      store = mockStore({ view: { homeMap: { center: [0, 0], id: 'deleted', name: 'Deleted', zoom: 3 } } });

      await store.dispatch(fetchMaps());

      expect(getSetHomeMaps()).toEqual([sector2]);
    });

    test('refreshes the selected quick link when the admin changed it', async () => {
      store = mockStore({ view: { homeMap: { ...park, title: 'Old Park', _persist: { rehydrated: true } } } });

      await store.dispatch(fetchMaps());

      expect(getSetHomeMaps()).toEqual([park]);
    });

    test('keeps the selected quick link when it is unchanged', async () => {
      store = mockStore({ view: { homeMap: { ...park, _persist: { rehydrated: true } } } });

      await store.dispatch(fetchMaps());

      expect(getSetHomeMaps()).toEqual([]);
    });

    test('warns without dispatching when the request fails', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      server.use(http.get(MAPS_API_URL, () => new HttpResponse(null, { status: 500 })));

      await store.dispatch(fetchMaps());

      expect(store.getActions()).toEqual([]);
      expect(warn).toHaveBeenCalledWith('error fetching the map quick links', expect.any(Error));

      warn.mockRestore();
    });
  });

  describe('mapsReducer', () => {
    test('stores the fetched quick links', () => {
      expect(mapsReducer(INITIAL_MAPS_STATE, { payload: [park], type: FETCH_MAPS_SUCCESS })).toEqual([park]);
    });
  });

  describe('homeMapReducer', () => {
    test('stores the selected quick link', () => {
      expect(homeMapReducer(INITIAL_HOME_MAP_STATE, setHomeMap(park))).toEqual(park);
    });
  });
});
