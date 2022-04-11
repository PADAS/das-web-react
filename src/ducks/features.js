import axios from 'axios';
import { API_URL } from '../constants';

import globallyResettableReducer from '../reducers/global-resettable';

export const FEATURESET_API_URL = `${API_URL}featureset/`;

// actions
const FETCH_FEATURESETS_SUCCESS = 'FETCH_FEATURESETS_SUCCESS';
const FETCH_FEATURESETS_ERROR = 'FETCH_FEATURESETS_ERROR';


// controlling individual featurestate using map#setFeatureState requires a integer based unique identifier, so we just increment this while building out the data. gross but manageable.
let featureLayerIdentifier = 0;

// action creators
export const fetchFeaturesets = () => async (dispatch) => {
  try {
    const { data: { features } } = await axios.get(FEATURESET_API_URL);

    const allFeatures = Promise.all(
      features.map(async (fs) => {
        const { data } = await axios.get(`${FEATURESET_API_URL}${fs.id}`).catch((error) => {
          console.warn(`error fetching ${fs.name} featureset, excluding from feature data`, error);
          return Promise.resolve({
            data: {
              features: [],
            },
          });
        });
        const featuresWithID = {
          ...data, features: data.features.map((f) => {
            featureLayerIdentifier++;
            return {
              ...f, id: featureLayerIdentifier, properties: { ...f.properties, id: f.properties.pk }
            };
          })
        };

        return ({
          geojson: featuresWithID,
          id: fs.id,
          name: fs.name,
        });
      })
    );

    allFeatures.then((results) => {
      const nonEmptySets = results.filter(item => !!item.geojson.features.length);
      dispatch({
        type: FETCH_FEATURESETS_SUCCESS,
        payload: nonEmptySets,
      });
    });
  } catch (e) {
    dispatch({
      type: FETCH_FEATURESETS_ERROR,
    });
  }
};

const INITIAL_FEATURESET_STATE = { data: [] };
// reducer
export default globallyResettableReducer((state, action) => {
  const { payload, type } = action;
  if (type === FETCH_FEATURESETS_SUCCESS) {
    return {
      data: payload,
    };
  }
  return state;
}, INITIAL_FEATURESET_STATE);