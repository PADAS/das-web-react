// Actions
const SET_FULL_SCREEN_IMAGE_DATA = 'SET_FULL_SCREEN_IMAGE_DATA';

// Action creators
export const showFullScreenImage = (file, source) => ({ type: SET_FULL_SCREEN_IMAGE_DATA, payload: { file, source } });

export const hideFullScreenImage = () => ({ type: SET_FULL_SCREEN_IMAGE_DATA, payload: { file: null, source: null } });

// Reducer
const INITIAL_STATE = { file: null, source: null };

const fullScreenImageReducer = (state = INITIAL_STATE, { type, payload }) => {
  switch (type) {
  case SET_FULL_SCREEN_IMAGE_DATA:
    return { ...state, file: payload.file, source: payload.source };

  default:
    return state;
  }
};

export default fullScreenImageReducer;
