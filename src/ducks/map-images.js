import globallyResettableReducer from '../reducers/global-resettable';

const ADD_IMAGE_TO_MAP_IF_NECESSARY = 'ADD_IMAGE_TO_MAP_IF_NECESSARY';

export const addImageToMapIfNecessary = (imgData, options) => ({
  type: ADD_IMAGE_TO_MAP_IF_NECESSARY,
  payload: {
    data: imgData,
    ...{ options },
  },
});

const INITIAL_STATE = {};
const mapImagesReducer = (state, action) => {
  const { payload, type } = action;
  if (type === ADD_IMAGE_TO_MAP_IF_NECESSARY && !state[payload.data.icon_id]) {
    return {
      ...state,
      [payload.data.icon_id]: {
        image: payload.data.image,
        options: payload.options,
      },
    };
  }
  return state;
};

export default globallyResettableReducer(mapImagesReducer, INITIAL_STATE);