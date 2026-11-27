import { applyMiddleware, combineReducers, createStore } from 'redux';
import { http, HttpResponse } from 'msw/http';
import { setupServer } from 'msw/node';
import { thunk } from 'redux-thunk';

import { resetGlobalState } from '../reducers/global-resettable';

import {
  FEATURE_API_URL,
  featureStoreReducer,
  fetchFeature,
  INITIAL_FEATURE_STORE_STATE,
} from './features';

const FEATURE_ID = 'feature-1';
const FEATURE_PROPERTIES = { attributes: { status: 'Open' }, id: FEATURE_ID, name: 'Water Point' };

let featureHandler;
let featureRequests;

const server = setupServer(
  http.get(`${FEATURE_API_URL}:featureId/`, (info) => {
    featureRequests.push(new URL(info.request.url));

    return featureHandler(info);
  }),
);

beforeAll(() => server.listen());

afterEach(() => server.resetHandlers());

afterAll(() => server.close());

describe('ducks - features', () => {
  let store;
  beforeEach(() => {
    featureHandler = () => HttpResponse.json({
      data: {
        features: [{ geometry: null, id: FEATURE_ID, properties: FEATURE_PROPERTIES, type: 'Feature' }],
        type: 'FeatureCollection',
      },
    });
    featureRequests = [];

    store = createStore(
      combineReducers({ data: combineReducers({ featureStore: featureStoreReducer }) }),
      applyMiddleware(thunk)
    );
  });

  describe('fetchFeature', () => {
    test('asks for the feature without its geometry', async () => {
      await store.dispatch(fetchFeature(FEATURE_ID));

      expect(featureRequests).toHaveLength(1);
      expect(featureRequests[0].pathname).toMatch(new RegExp(`feature/${FEATURE_ID}/$`));
      expect(featureRequests[0].searchParams.get('include_geometry')).toBe('false');
    });

    test('stores the properties of the feature by its id', async () => {
      await store.dispatch(fetchFeature(FEATURE_ID));

      expect(store.getState().data.featureStore).toEqual({ [FEATURE_ID]: { properties: FEATURE_PROPERTIES } });
    });

    test('does not request a feature it already stores', async () => {
      await store.dispatch(fetchFeature(FEATURE_ID));
      await store.dispatch(fetchFeature(FEATURE_ID));

      expect(featureRequests).toHaveLength(1);
    });

    test('shares the request of a feature already on its way', async () => {
      await Promise.all([store.dispatch(fetchFeature(FEATURE_ID)), store.dispatch(fetchFeature(FEATURE_ID))]);

      expect(featureRequests).toHaveLength(1);
    });

    test('marks the feature as loading while its request is on its way', async () => {
      const featureRequest = store.dispatch(fetchFeature(FEATURE_ID));

      expect(store.getState().data.featureStore[FEATURE_ID]).toEqual({ isLoading: true });

      await featureRequest;
    });

    test('requests a feature again after its request failed', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      featureHandler = () => new HttpResponse(null, { status: 500 });

      await store.dispatch(fetchFeature(FEATURE_ID));

      expect(store.getState().data.featureStore[FEATURE_ID]).toEqual({ hasError: true });

      featureHandler = () => HttpResponse.json({
        data: { features: [{ geometry: null, properties: FEATURE_PROPERTIES }], type: 'FeatureCollection' },
      });

      await store.dispatch(fetchFeature(FEATURE_ID));

      expect(featureRequests).toHaveLength(2);
      expect(store.getState().data.featureStore[FEATURE_ID]).toEqual({ properties: FEATURE_PROPERTIES });
    });
  });

  describe('featureStoreReducer', () => {
    test('forgets every stored feature on sign-out', async () => {
      await store.dispatch(fetchFeature(FEATURE_ID));

      store.dispatch(resetGlobalState());

      expect(store.getState().data.featureStore).toEqual(INITIAL_FEATURE_STORE_STATE);
    });
  });
});
