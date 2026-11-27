import { persistReducer, REHYDRATE } from 'redux-persist';

import { generateStorageConfig } from '../../reducers/storage-config';
import { LAYER_IDS } from '../../constants';
import {
  displayMapNamesReducer,
  INITIAL_MAP_CLUSTER_STATE,
  mapClusterConfigReducer,
  SET_MAP_CLUSTER_DATA,
  SET_SHOW_MAP_CLUSTER_POLYGONS,
  setMapClusterData,
  setShowMapClusterPolygons
} from './';

describe('Ducks - Map UI', () => {
  test('setMapClusterData dispatches the SET_MAP_CLUSTER_DATA action', async () => {
    expect(setMapClusterData({ events: false, subjects: false })).toEqual({
      payload: {
        events: false,
        subjects: false,
      },
      type: SET_MAP_CLUSTER_DATA,
    });
  });

  test('setShowMapClusterPolygons dispatches the SET_SHOW_MAP_CLUSTER_POLYGONS action', async () => {
    expect(setShowMapClusterPolygons(false)).toEqual({
      payload: false,
      type: SET_SHOW_MAP_CLUSTER_POLYGONS,
    });
  });

  describe('mapClusterConfigReducer', () => {
    test('returns the initial state', async () => {
      expect(mapClusterConfigReducer(undefined, {})).toEqual(INITIAL_MAP_CLUSTER_STATE);
    });

    test('handles a SET_MAP_CLUSTER_DATA action', async () => {
      const action = {
        payload: {
          events: false,
          subjects: false,
        },
        type: SET_MAP_CLUSTER_DATA,
      };
      const expectedState = {
        data: {
          events: false,
          subjects: false,
        },
        showPolygons: true,
      };

      expect(mapClusterConfigReducer(INITIAL_MAP_CLUSTER_STATE, action)).toEqual(expectedState);
    });

    test('handles a SET_SHOW_MAP_CLUSTER_POLYGONS action', async () => {
      const action = {
        payload: false,
        type: SET_SHOW_MAP_CLUSTER_POLYGONS,
      };
      const expectedState = {
        data: {
          events: true,
          subjects: true,
        },
        showPolygons: false,
      };

      expect(mapClusterConfigReducer(INITIAL_MAP_CLUSTER_STATE, action)).toEqual(expectedState);
    });
  });

  describe('displayMapNamesReducer', () => {
    test('keeps the default of a marker names option missing from an older persisted state', () => {
      const persistedDisplayMapNamesReducer = persistReducer(
        generateStorageConfig('mapLabelPreferences'),
        displayMapNamesReducer
      );

      const initialState = persistedDisplayMapNamesReducer(undefined, { type: '@@INIT' });
      const state = persistedDisplayMapNamesReducer(initialState, {
        key: 'mapLabelPreferences',
        payload: {
          [LAYER_IDS.EVENT_SYMBOLS]: { key: 'reports', enabled: false },
          [LAYER_IDS.PATROL_SYMBOLS]: { key: 'patrols', enabled: true },
          [LAYER_IDS.STATIC_SENSOR]: { key: 'stationary_subjects', enabled: true },
          [LAYER_IDS.SUBJECT_SYMBOLS]: { key: 'subjects', enabled: false },
          _persist: { rehydrated: true, version: -1 },
        },
        type: REHYDRATE,
      });

      expect(state).toEqual(expect.objectContaining({
        [LAYER_IDS.EVENT_SYMBOLS]: { key: 'reports', enabled: false },
        [LAYER_IDS.PATROL_SYMBOLS]: { key: 'patrols', enabled: true },
        'spatial-features-labels': { key: 'features', enabled: false },
        [LAYER_IDS.STATIC_SENSOR]: { key: 'stationary_subjects', enabled: true },
        [LAYER_IDS.SUBJECT_SYMBOLS]: { key: 'subjects', enabled: false },
      }));
    });
  });
});
