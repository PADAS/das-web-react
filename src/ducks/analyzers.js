import axios from 'axios';
import { API_URL } from '../constants';
import { featureCollection } from '@turf/helpers';

export const ANALYZERS_API_URL = `${API_URL}analyzers/spatial?active=true`;

// actions
export const FETCH_ANALYZERS = 'FETCH_ANALYZERS';
export const FETCH_ANALYZERS_SUCCESS = 'FETCH_ANALYZERS_SUCCESS';
export const FETCH_ANALYZERS_ERROR = 'FETCH_ANALYZERS_ERROR';

// action creator - fetches the analyzer list, and then 
// aggregates the features in that list and displayed in a AnalyzerLayer
let featureLayerIdentifier = 1000;

export const fetchAnalyzers = () => async (dispatch) => {

  // fetch the active analyzers, only processing the non-ull urls
  const { data: { data } } = await axios.get(ANALYZERS_API_URL);

  // XXX redo this one, should just ship the analyzer data and the features
  // to the selector, and sort it out there.
  try {
    const analyzers = await Promise.all(data.map(async (analyzer) => {
      const spatialUrls = Object.values(analyzer.spatial_groups);
      const nonNullLinks = spatialUrls.filter(x => x);
      const fetchedFeatures = await Promise.all(nonNullLinks.map(async (link) => {
        const { data: result } = await axios.get(link);
        const concatFeatures = [];
        result.data.features.forEach((feature) => {
          const { features } = feature;
          features[0]['id'] = featureLayerIdentifier++;
          features[0].properties['admin_href'] = analyzer.admin_href;
          concatFeatures.push(features[0]);
        });
        return concatFeatures;
      }));
      // flatten the feature array -
      const features = [].concat(...fetchedFeatures);
      return { id: analyzer.id, name: analyzer.name, type: analyzer.analyzer_category, geojson: featureCollection(features) }
    }));

    const results = analyzers.filter(item => !!item.geojson.features.length);
    dispatch({
      type: FETCH_ANALYZERS_SUCCESS,
      payload: results,
    });
  }
  catch (e) {
    console.log("error creating geoanalyzer data: ", e);
    dispatch({
      type: FETCH_ANALYZERS_ERROR,
    });
  }
};

const INITIAL_ANALYZER_FEATURE_STATE = [];
// reducer
const analyzersReducer = (state = INITIAL_ANALYZER_FEATURE_STATE, action) => {
  const { payload, type } = action;
  if (type === FETCH_ANALYZERS_SUCCESS) {
    return payload;
  }
  return state;
};

export default analyzersReducer;


