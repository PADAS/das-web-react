import axios from 'axios';
import { API_URL, API_V2_URL } from '../constants';

import globallyResettableReducer from '../reducers/global-resettable';

export const FEATURE_API_URL = `${API_V2_URL}feature/`;
export const FEATURESET_API_URL = `${API_URL}featureset/`;

// actions
export const FETCH_FEATURE_ERROR = 'FEATURES.FETCH_FEATURE_ERROR';
export const FETCH_FEATURE_START = 'FEATURES.FETCH_FEATURE_START';
export const FETCH_FEATURE_SUCCESS = 'FEATURES.FETCH_FEATURE_SUCCESS';
const FETCH_FEATURESETS_SUCCESS = 'FETCH_FEATURESETS_SUCCESS';
const FETCH_FEATURESETS_ERROR = 'FETCH_FEATURESETS_ERROR';

// action creators
// A feature already stored or on its way is not requested again; a failed one is.
export const fetchFeature = (featureId) => async (dispatch, getState) => {
  const storedFeature = getState().data.featureStore[featureId];

  if (!storedFeature?.properties && !storedFeature?.isLoading) {
    dispatch({ payload: featureId, type: FETCH_FEATURE_START });

    try {
      const response = await axios.get(`${FEATURE_API_URL}${featureId}/`, { params: { include_geometry: false } });

      dispatch({
        payload: { featureId, properties: response.data.data.features[0].properties },
        type: FETCH_FEATURE_SUCCESS,
      });
    } catch (error) {
      console.warn('Error fetching the spatial feature', error);

      dispatch({ payload: featureId, type: FETCH_FEATURE_ERROR });
    }
  }
};

export const fetchFeaturesets = () => async (dispatch) => {
  try {
    const { data } = await axios.get(FEATURESET_API_URL, { params: { summarize_features: true } });

    const { features } = data;

    const nonEmptySets = features.filter(featureset => !!featureset.types.length);

    dispatch({
      type: FETCH_FEATURESETS_SUCCESS,
      payload: nonEmptySets,
    });
  } catch {
    dispatch({
      type: FETCH_FEATURESETS_ERROR,
    });
  }
};

// reducers
export const INITIAL_FEATURE_STORE_STATE = {};

export const featureStoreReducer = globallyResettableReducer((state, action) => {
  switch (action.type) {
  case FETCH_FEATURE_ERROR:
    return { ...state, [action.payload]: { hasError: true } };

  case FETCH_FEATURE_START:
    return { ...state, [action.payload]: { isLoading: true } };

  case FETCH_FEATURE_SUCCESS:
    return { ...state, [action.payload.featureId]: { properties: action.payload.properties } };

  default:
    return state;
  }
}, INITIAL_FEATURE_STORE_STATE);

const INITIAL_FEATURESET_STATE = { data: [] };
export default globallyResettableReducer((state, action) => {
  const { payload, type } = action;
  if (type === FETCH_FEATURESETS_SUCCESS) {
    return {
      data: payload,
    };
  }
  return state;
}, INITIAL_FEATURESET_STATE);
