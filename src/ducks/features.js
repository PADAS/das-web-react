import axios from 'axios';
import { API_URL } from '../constants';
import { featureCollection } from '@turf/helpers';
import uniq from 'lodash/uniq';

const FEATURESET_API_URL = `${API_URL}featureset/`

// actions
const FETCH_FEATURESETS_SUCCESS = 'FETCH_FEATURESETS_SUCCESS';
const FETCH_FEATURESETS_ERROR = 'FETCH_FEATURESETS_ERROR';

const HIDE_FEATURES = 'HIDE_FEATURES';
const SHOW_FEATURES = 'SHOW_FEATURES';


// action creators
export const fetchFeaturesets = () => async (dispatch) => {
  try {
    const { data: { features } } = await axios.get(FEATURESET_API_URL);

    const allFeatures = await Promise.all(
      features.map(async (fs) => {
        const { data } = await axios.get(`${FEATURESET_API_URL}${fs.id}`)
        return data;
      })
    );

    const results = allFeatures
      .filter(({ features }) => !!features.length)
      .map((data, index) => ({
        name: features[index].name,
        id: features[index].id,
        geojson: data,
      }));
    dispatch({
      type: FETCH_FEATURESETS_SUCCESS,
      payload: results,
    });
  } catch (e) {
    dispatch({
      type: FETCH_FEATURESETS_ERROR,
    });
  }
};

const INITIAL_FEATURESET_STATE = [];
// reducer
export default (state = INITIAL_FEATURESET_STATE, action) => {
  const { payload, type } = action;
  if (type === FETCH_FEATURESETS_SUCCESS) {
    return payload;
  }
  return state;
};