const UPDATE_MAP_DISPLAY_CONFIG = 'UPDATE_MAP_DISPLAY_CONFIG';

const updateMapDisplayConfig = (config) => ({
  type: UPDATE_MAP_DISPLAY_CONFIG,
  payload: config,
});

const INITIAL_STATE = {
  subjects: {
    lastUpdateFade: [

    ],
  }
};

const mapDataDisplayConfigReducer = (state = INITIAL_STATE, { type, payload }) => {
  if (type === UPDATE_MAP_DISPLAY_CONFIG) {

  }

  return state;
};