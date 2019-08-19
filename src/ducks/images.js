const ADD_MAP_IMAGE_TO_CACHE = 'ADD_MAP_IMAGE_TO_CACHE';

export const addMapImageToCache = (icon_id, imgEl) => ({
  type: ADD_MAP_IMAGE_TO_CACHE,
  payload: {
    icon_id, imgEl,
  },
});

const INITIAL_MAP_IMAGE_CACHE_STATE = {};

const mapImagesReducer = (state = INITIAL_MAP_IMAGE_CACHE_STATE, { type, payload }) => {
  if (type === ADD_MAP_IMAGE_TO_CACHE) {
    const { icon_id, imgEl } = payload;
    return {
      ...state,
      [icon_id]: imgEl,
    };
  }
  return state;
};


export default mapImagesReducer;