import axios from 'axios';
import { API_URL } from '../constants';

const FEATURESET_API_URL = `${API_URL}featureset/`

// actions
const FETCH_FEATURESETS_SUCCESS = 'FETCH_FEATURESETS_SUCCESS';
const FETCH_FEATURESETS_ERROR = 'FETCH_FEATURESETS_ERROR';

// action creators
export const fetchFeaturesets = () => async (dispatch) => {
  try {
    const { data: { features } } = await axios.get(FEATURESET_API_URL);

    const allFeatures = await Promise.all(
      features.map(async (fs) => {
        const { data } = await axios.get(`${FEATURESET_API_URL}${fs.id}`)
        return ({
          geojson: data,
          id: fs.id,
          name: fs.name,
        });
      })
    );

    const results = allFeatures.filter(item => !!item.geojson.features.length);
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