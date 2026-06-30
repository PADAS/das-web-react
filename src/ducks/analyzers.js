import { API_URL } from '../constants';
import axios from 'axios';
import { buffer, featureCollection } from '@turf/turf';

import globallyResettableReducer from '../reducers/global-resettable';

export const ANALYZERS_API_URL = `${API_URL}analyzers/spatial`;

// actions
export const FETCH_ANALYZERS_SUCCESS = 'FETCH_ANALYZERS_SUCCESS';

const DEFAULT_PROXIMITY_ANALYZER_DISPLAY_RADIUS = 500; // meters

// action creator - fetches the analyzer list, and then 
// aggregates the features in that list and displayed in a AnalyzerLayer
let featureLayerIdentifier = 1000;

export const fetchAnalyzers = () => async (dispatch) => {
  // fetch the active analyzers, only processing the non-null spatial group urls
  const { data: { data } } = await axios.get(ANALYZERS_API_URL, { params: { active: true } });

  const analyzers = await Promise.all(data.map(async (analyzer) => {
    // isolate per-analyzer processing so one bad analyzer can't reject the
    // whole Promise.all and wipe out the entire analyzer list
    try {
      const spatialEntries = Object.entries(analyzer.spatial_groups);
      const nonNullLinks = spatialEntries.filter(entry => entry[1] !== null);
      const fetchedFeatures = await Promise.all(nonNullLinks.map(async (link) => {
        const { data: result } = await axios.get(link[1]);
        const concatFeatures = [];
        result.data.features.forEach((analyzerFeature) => {
          const feature = analyzerFeature.features[0];
          feature.id = featureLayerIdentifier++;
          if (analyzer.analyzer_category === 'proximity') {

            const proximityPoly = buffer(
              feature,
              (analyzer?.threshold_dist_meters ?? DEFAULT_PROXIMITY_ANALYZER_DISPLAY_RADIUS) / 1000,
              {
                steps: 32,
                units: 'kilometers',
              }
            );
            feature.geometry = proximityPoly.geometry;
          }
          feature.properties.admin_href = analyzer.admin_href;
          feature.properties.title = analyzer.name;
          feature.properties.analyzer_type = analyzer.analyzer_category;
          feature.properties.spatial_group = feature.geometry.type + '.' + link[0];
          feature.properties.id = feature.properties.pk;
          concatFeatures.push(feature);
        });
        return concatFeatures;
      }));
      // flatten the feature array -
      const features = [].concat(...fetchedFeatures);
      return { id: analyzer.id, name: analyzer.name, type: analyzer.analyzer_category, geojson: featureCollection(features) };
    } catch (error) {
      console.warn(`error processing analyzer "${analyzer.name}" (${analyzer.id})`, error);
      return null;
    }
  }));

  const results = analyzers.filter(item => !!item && !!item.geojson.features.length);

  dispatch({
    type: FETCH_ANALYZERS_SUCCESS,
    payload: results,
  });
};

const INITIAL_ANALYZER_FEATURE_STATE = { data: [] };
// reducer
const analyzersReducer = (state, action) => {
  const { payload, type } = action;
  if (type === FETCH_ANALYZERS_SUCCESS) {
    return {
      data: payload
    };
  }
  return state;
};

export default globallyResettableReducer(analyzersReducer, INITIAL_ANALYZER_FEATURE_STATE);


