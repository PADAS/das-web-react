import mapLayerFilterReducer, {
  displayReportsOnMapState,
  hideAnalyzers,
  hideFeatures,
  hideSubjects,
  hideSubjectsFromAtlas,
  INITIAL_FILTER_STATE,
  mapLayerFilterPersistenceConfig,
  SET_GROUPED,
  SET_SORT_BY,
  SET_SORT_DIRECTION,
  SET_TEXT,
  setMapLayersFilterText,
  setMapLayersFilterTextFromAtlas,
  setMapLayersGrouped,
  setMapLayersSortBy,
  setMapLayersSortDirection,
  showAnalyzers,
  showFeatures,
  showSubjects,
  showSubjectsFromAtlas,
} from '.';
import { MAP_LAYER_SORT_VALUES, SORT_DIRECTION } from '../../constants';

describe('mapLayerFilterReducer', () => {
  test('setMapLayersFilterText dispatches the SET_TEXT action', async () => {
    expect(setMapLayersFilterText('search')).toEqual({ payload: 'search', type: SET_TEXT });
  });

  test('setMapLayersGrouped dispatches the SET_GROUPED action', async () => {
    expect(setMapLayersGrouped(false)).toEqual({ payload: false, type: SET_GROUPED });
  });

  test('setMapLayersSortBy dispatches the SET_SORT_BY action', async () => {
    expect(setMapLayersSortBy(MAP_LAYER_SORT_VALUES.ALPHABETICAL)).toEqual({
      payload: MAP_LAYER_SORT_VALUES.ALPHABETICAL,
      type: SET_SORT_BY,
    });
  });

  test('setMapLayersSortDirection dispatches the SET_SORT_DIRECTION action', async () => {
    expect(setMapLayersSortDirection(SORT_DIRECTION.up)).toEqual({
      payload: SORT_DIRECTION.up,
      type: SET_SORT_DIRECTION,
    });
  });

  describe('mapLayerFilterReducer', () => {
    it('returns the initial state', () => {
      expect(mapLayerFilterReducer(undefined, {})).toEqual(INITIAL_FILTER_STATE);
    });

    it('should handle HIDE_SUBJECTS action', () => {
      const initialState = { ...INITIAL_FILTER_STATE, hiddenSubjectIDs: ['id-1-hello', 'id-2-wow', 'id-3-very-cool'] };
      const action = hideSubjects('id-2-wow', 'id-4-yes');
      const expectedState = { ...initialState, hiddenSubjectIDs: ['id-2-wow', 'id-4-yes', 'id-1-hello', 'id-3-very-cool'] };
      const result = mapLayerFilterReducer(initialState, action);
      expect(result).toEqual(expectedState);
    });

    it('should handle SHOW_SUBJECTS action', () => {
      const initialState = { ...INITIAL_FILTER_STATE, hiddenSubjectIDs: ['id-1-hello', 'id-2-wow', 'id-3-very-cool'] };
      const action = showSubjects('id-2-wow');
      const expectedState = { ...initialState, hiddenSubjectIDs: ['id-1-hello', 'id-3-very-cool'] };
      const result = mapLayerFilterReducer(initialState, action);
      expect(result).toEqual(expectedState);
    });

    it('should handle HIDE_FEATURES action', () => {
      const initialState = { ...INITIAL_FILTER_STATE, hiddenFeatureIDs: ['id-1-hello', 'id-2-wow', 'id-3-very-cool'] };
      const action = hideFeatures('id-2-wow', 'id-4-yes');
      const expectedState = { ...initialState, hiddenFeatureIDs: ['id-2-wow', 'id-4-yes', 'id-1-hello', 'id-3-very-cool'] };
      const result = mapLayerFilterReducer(initialState, action);
      expect(result).toEqual(expectedState);
    });

    it('should handle SHOW_FEATURES action', () => {
      const initialState = { ...INITIAL_FILTER_STATE, hiddenFeatureIDs: ['id-1-hello', 'id-2-wow', 'id-3-very-cool'] };
      const action = showFeatures('id-2-wow', 'id-4-yes');
      const expectedState = { ...initialState, hiddenFeatureIDs: ['id-1-hello', 'id-3-very-cool'] };
      const result = mapLayerFilterReducer(initialState, action);
      expect(result).toEqual(expectedState);
    });

    it('should handle HIDE_ANALYZERS action', () => {
      const initialState = { ...INITIAL_FILTER_STATE, hiddenAnalyzerIDs: ['id-1-hello', 'id-2-wow', 'id-3-very-cool'] };
      const action = hideAnalyzers('id-2-wow', 'id-4-yes');
      const expectedState = { ...initialState, hiddenAnalyzerIDs: ['id-2-wow', 'id-4-yes', 'id-1-hello', 'id-3-very-cool'] };
      const result = mapLayerFilterReducer(initialState, action);
      expect(result).toEqual(expectedState);
    });

    it('should handle SHOW_ANALYZERS action', () => {
      const initialState = { ...INITIAL_FILTER_STATE, hiddenAnalyzerIDs: ['id-1-hello', 'id-2-wow', 'id-3-very-cool'] };
      const action = showAnalyzers('id-2-wow', 'id-4-yes');
      const expectedState = { ...initialState, hiddenAnalyzerIDs: ['id-1-hello', 'id-3-very-cool'] };
      const result = mapLayerFilterReducer(initialState, action);
      expect(result).toEqual(expectedState);
    });

    it('should handle DISPLAY_REPORTS_ON_MAP action', () => {
      const initialState = { ...INITIAL_FILTER_STATE, showReportsOnMap: true };
      const action = displayReportsOnMapState(false);
      const expectedState = { ...initialState, showReportsOnMap: false };
      const result = mapLayerFilterReducer(initialState, action);
      expect(result).toEqual(expectedState);
    });

    test('handles a SET_GROUPED action', async () => {
      const payload = false;
      const action = { payload, type: SET_GROUPED };
      const expectedState = { ...INITIAL_FILTER_STATE, grouped: false };

      expect(mapLayerFilterReducer(INITIAL_FILTER_STATE, action)).toEqual(expectedState);
    });

    test('handles a SET_SORT_BY action', async () => {
      const payload = MAP_LAYER_SORT_VALUES.ALPHABETICAL;
      const action = { payload, type: SET_SORT_BY };
      const expectedState = { ...INITIAL_FILTER_STATE, sortBy: MAP_LAYER_SORT_VALUES.ALPHABETICAL };

      expect(mapLayerFilterReducer(INITIAL_FILTER_STATE, action)).toEqual(expectedState);
    });

    test('handles a SET_SORT_DIRECTION action', async () => {
      const payload = SORT_DIRECTION.up;
      const action = { payload, type: SET_SORT_DIRECTION };
      const expectedState = { ...INITIAL_FILTER_STATE, sortDirection: SORT_DIRECTION.up };

      expect(mapLayerFilterReducer(INITIAL_FILTER_STATE, action)).toEqual(expectedState);
    });

    test('handles a SET_TEXT action', async () => {
      const payload = 'search';
      const action = { payload, type: SET_TEXT };
      const expectedState = { ...INITIAL_FILTER_STATE, text: 'search' };

      expect(mapLayerFilterReducer(INITIAL_FILTER_STATE, action)).toEqual(expectedState);
    });
  });

  describe('when Atlas changes the filter', () => {
    const calcStoredValue = (state, key) => mapLayerFilterPersistenceConfig.transforms
      .reduce((value, transform) => transform.in(value, key, state), state[key]);

    const reduce = (state, ...actions) => actions.reduce(mapLayerFilterReducer, state);

    test('applies the subjects Atlas hides and shows', () => {
      const state = reduce(
        { ...INITIAL_FILTER_STATE, hiddenSubjectIDs: ['kito'] },
        hideSubjectsFromAtlas('zawadi'),
        showSubjectsFromAtlas('kito')
      );

      expect(state.hiddenSubjectIDs).toEqual(['zawadi']);
    });

    test('stores the hidden subjects as they were before Atlas changed them', () => {
      const state = reduce(
        { ...INITIAL_FILTER_STATE, hiddenSubjectIDs: ['kito', 'tumaini'] },
        hideSubjectsFromAtlas('zawadi', 'kito'),
        showSubjectsFromAtlas('tumaini'),
        hideSubjectsFromAtlas('tumaini')
      );

      expect(calcStoredValue(state, 'hiddenSubjectIDs').sort()).toEqual(['kito', 'tumaini']);
    });

    test('stores a subject the user changes after Atlas as the user left it', () => {
      const state = reduce(
        INITIAL_FILTER_STATE,
        hideSubjectsFromAtlas('zawadi', 'kito'),
        showSubjects('zawadi'),
        hideSubjects('zawadi')
      );

      expect(calcStoredValue(state, 'hiddenSubjectIDs')).toEqual(['zawadi']);
    });

    test('stores the search text as it was before Atlas changed it', () => {
      const state = reduce(
        { ...INITIAL_FILTER_STATE, text: 'boma' },
        setMapLayersFilterTextFromAtlas('Kito'),
        setMapLayersFilterTextFromAtlas('fence')
      );

      expect(state.text).toBe('fence');
      expect(calcStoredValue(state, 'text')).toBe('boma');
    });

    test('stores the search text the user types after Atlas', () => {
      const state = reduce(
        { ...INITIAL_FILTER_STATE, text: 'boma' },
        setMapLayersFilterTextFromAtlas('Kito'),
        setMapLayersFilterText('fence')
      );

      expect(calcStoredValue(state, 'text')).toBe('fence');
    });

    test('does not store the record of what Atlas replaced', () => {
      const state = reduce(
        INITIAL_FILTER_STATE,
        hideSubjectsFromAtlas('zawadi'),
        setMapLayersFilterTextFromAtlas('Kito')
      );
      const changedKeys = Object.keys(state).filter((key) => state[key] !== INITIAL_FILTER_STATE[key]);

      expect(mapLayerFilterPersistenceConfig.blacklist).toEqual(
        expect.arrayContaining(changedKeys.filter((key) => !['hiddenSubjectIDs', 'text'].includes(key)))
      );
    });
  });
});
