export const SET_MAP_FEATURE_HIGHLIGHT_IDS = 'SET_MAP_FEATURE_HIGHLIGHT_IDS';

export const setMapFeatureHighlightIDs = (featureIDs) => ({
  type: SET_MAP_FEATURE_HIGHLIGHT_IDS,
  payload: featureIDs,
});

const INITIAL_FEATURE_HIGHLIGHT_STATE = [];
export const mapFeatureHighlightIdReducer = (state = INITIAL_FEATURE_HIGHLIGHT_STATE, action) => {
  const { type, payload } = action;
  if (type === SET_MAP_FEATURE_HIGHLIGHT_IDS) {
    return payload;
  };
  return state;
};