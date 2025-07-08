import {
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
});
