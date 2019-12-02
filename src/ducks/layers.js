import { get } from 'axios';
import { API_URL, REACT_APP_BASE_MAP_STYLES } from '../constants';

const FETCH_BASE_LAYERS_START = 'FETCH_BASE_LAYERS_START';
const FETCH_BASE_LAYERS_SUCCESS = 'FETCH_BASE_LAYERS_SUCCESS';
const FETCH_BASE_LAYERS_ERROR = 'FETCH_BASE_LAYERS_ERROR';

const SET_BASE_LAYER = 'SET_BASE_LAYER';

const BASE_LAYER_API_URL = `${API_URL}layers`;

export const fetchBaseLayers = () => async (dispatch) => {
  dispatch({
    type: FETCH_BASE_LAYERS_START,
  });

  try {
    const { data: { data:results } } = await get(BASE_LAYER_API_URL);
    dispatch({
      type: FETCH_BASE_LAYERS_SUCCESS,
      payload: results,
    });

  } catch (e) {
    dispatch({
      type: FETCH_BASE_LAYERS_ERROR,
      payload: e,
    });
    return Promise.reject(e);
  }
};

export const setBaseLayer = (layer) => ({
  type: SET_BASE_LAYER,
  payload: layer,
});

const DEFAULT_BASE_LAYER = {
  name: 'EarthRanger Terrain Map',
  id: 'earthranger-terrain-map',
  attributes: {
    url: REACT_APP_BASE_MAP_STYLES,
    type: 'mapbox_style',
  },
};

const INITIAL_BASE_LAYERS_STATE = [DEFAULT_BASE_LAYER];
const baseLayersReducer = (state = INITIAL_BASE_LAYERS_STATE, { type, payload }) => {
  if (type === FETCH_BASE_LAYERS_SUCCESS) return [DEFAULT_BASE_LAYER, ...payload];
  return state;
};

export default baseLayersReducer;

export const currentBaseLayerReducer = (state = DEFAULT_BASE_LAYER, { type, payload }) => {
  if (type === SET_BASE_LAYER) {
    return payload;
  }
  return state;
};
