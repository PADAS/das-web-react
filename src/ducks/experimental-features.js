// Actions
export const SET_EXPERIMENTAL_FEATURES = 'EXPERIMENTAL_FEATURES.SET_EXPERIMENTAL_FEATURES';

// Action creators
export const setExperimentalFeatures = (experimentalFeatures) => ({
  payload: experimentalFeatures,
  type: SET_EXPERIMENTAL_FEATURES,
});

// Reducer
export const INITIAL_STATE = {};

const experimentalFeaturesReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
  case SET_EXPERIMENTAL_FEATURES:
    return action.payload;

  default:
    return state;
  }
};

export default experimentalFeaturesReducer;
