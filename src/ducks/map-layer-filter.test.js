import mapLayerFilterReducer, { INITIAL_FILTER_STATE,
  hideSubjects, showSubjects, hideFeatures,
  showFeatures, hideAnalyzers, updateMapLayerFilter,
  showAnalyzers, displayReportsOnMapState
} from './map-layer-filter';

describe('mapLayerFilterReducer', () => {
  it('should return the initial state', () => {
    const action = { type: 'UNKNOWN_ACTION' };
    const result = mapLayerFilterReducer(undefined, action);
    expect(result).toEqual(INITIAL_FILTER_STATE);
  });

  it('should handle UPDATE_MAP_LAYER_FILTER action', () => {
    const initialState = { ...INITIAL_FILTER_STATE, text: 'initial text' };
    const action = updateMapLayerFilter({ text: 'updated text' });
    const expectedState = { ...initialState, text: 'updated text' };
    const result = mapLayerFilterReducer(initialState, action);
    expect(result).toEqual(expectedState);
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
});