import { SET_MAP_FEATURE_HIGHLIGHT_IDS, mapFeatureHighlightIdReducer } from './mapFeatureHighlight';

describe('mapFeatureHighlightIdReducer', () => {
  it('updates state with SET_MAP_FEATURE_HIGHLIGHT_IDS action', () => {
    const initialState = [];
    const action = {
      type: SET_MAP_FEATURE_HIGHLIGHT_IDS,
      payload: ['feature1', 'feature2'],
    };
    const newState = mapFeatureHighlightIdReducer(initialState, action);
    expect(newState).toEqual(['feature1', 'feature2']);
  });
});