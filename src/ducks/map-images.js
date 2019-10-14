const ADD_IMAGE_TO_MAP_IF_NECESSARY = 'ADD_IMAGE_TO_MAP_IF_NECESSARY';

export const addImageToMapIfNecessary = (imgData) => ({
  type: ADD_IMAGE_TO_MAP_IF_NECESSARY,
  payload: imgData,
});

const INITIAL_STATE = {};
const mapImagesReducer = (state = INITIAL_STATE, action) => {
  const { payload, type } = action;
  if (type === ADD_IMAGE_TO_MAP_IF_NECESSARY && !state[payload.icon_id]) {
    return {
      ...state,
      [payload.icon_id]: payload.image,
    };
  }
  return state;
};

export default mapImagesReducer;