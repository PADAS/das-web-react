import { API_URL } from '../constants';
import axios, { isCancel } from 'axios';
import { featureCollection } from '@turf/turf';

import globallyResettableReducer from '../reducers/global-resettable';

export const ANALYZERS_API_URL = `${API_URL}analyzers/spatial`;

// actions
export const FETCH_ANALYZERS_SUCCESS = 'FETCH_ANALYZERS_SUCCESS';

const DEFAULT_PROXIMITY_ANALYZER_DISPLAY_RADIUS = 500; // meters
const PROXIMITY_BUFFER_STEPS = 32;
const METERS_PER_KILOMETER = 1000;

let featureLayerIdentifier = 1000;

const warnAnalyzerFailure = (analyzer, error, spatialGroupName) => {
  const location = spatialGroupName ? ` spatial group "${spatialGroupName}" of` : '';

  console.warn(`error processing${location} analyzer "${analyzer.name}" (${analyzer.id})`, error);
};

/**
 * Proximity analyzers display as a footprint buffered around their source
 * geometry by the analyzer's trigger distance. Turf yields no geometry for
 * input it cannot buffer — a negative distance over a line, for instance — so
 * make that an explicit failure rather than a downstream TypeError.
 */
const proximityFootprintGeometry = (feature, thresholdDistMeters, buffer) => {
  const radiusMeters = thresholdDistMeters ?? DEFAULT_PROXIMITY_ANALYZER_DISPLAY_RADIUS;
  const footprint = buffer(feature, radiusMeters / METERS_PER_KILOMETER, {
    steps: PROXIMITY_BUFFER_STEPS,
    units: 'kilometers',
  });

  if (!footprint?.geometry) {
    throw new Error(`could not buffer ${feature?.geometry?.type} geometry by ${radiusMeters}m`);
  }

  return footprint.geometry;
};

const toAnalyzerLayerFeature = (feature, analyzer, buffer, spatialGroupName) => {
  feature.id = featureLayerIdentifier++;

  if (analyzer.analyzer_category === 'proximity') {
    feature.geometry = proximityFootprintGeometry(feature, analyzer?.threshold_dist_meters, buffer);
  }

  feature.properties.admin_href = analyzer.admin_href;
  feature.properties.title = analyzer.name;
  feature.properties.analyzer_type = analyzer.analyzer_category;
  feature.properties.spatial_group = `${feature.geometry.type}.${spatialGroupName}`;
  feature.properties.id = feature.properties.pk;

  return feature;
};

// one unusable feature shouldn't discard the rest of its spatial group
const fetchSpatialGroupFeatures = async (analyzer, buffer, [spatialGroupName, url]) => {
  const { data: { data: { features: spatialGroupFeatures } } } = await axios.get(url);

  return spatialGroupFeatures.reduce((accumulator, { features: [feature] }) => {
    try {
      accumulator.push(toAnalyzerLayerFeature(feature, analyzer, buffer, spatialGroupName));
    } catch (error) {
      warnAnalyzerFailure(analyzer, error, spatialGroupName);
    }

    return accumulator;
  }, []);
};

// ...and one unusable spatial group shouldn't discard its sibling groups
const fetchAnalyzerFeatures = async (analyzer, buffer) => {
  const spatialGroupLinks = Object.entries(analyzer.spatial_groups).filter(([, url]) => url !== null);
  const settled = await Promise.allSettled(
    spatialGroupLinks.map((link) => fetchSpatialGroupFeatures(analyzer, buffer, link))
  );

  return settled.reduce((accumulator, result, index) => {
    if (result.status === 'fulfilled') {
      return [...accumulator, ...result.value];
    }

    if (isCancel(result.reason)) {
      throw result.reason;
    }

    warnAnalyzerFailure(analyzer, result.reason, spatialGroupLinks[index][0]);

    return accumulator;
  }, []);
};

// action creator - fetches the analyzer list, and then
// aggregates the features in that list and displayed in a AnalyzerLayer
export const fetchAnalyzers = () => async (dispatch) => {
  // fetch the active analyzers, only processing the non-null spatial group urls
  const { data: { data: activeAnalyzers } } = await axios.get(ANALYZERS_API_URL, { params: { active: true } });

  // Lazy-load buffer (pulls in @turf/jsts) only when a proximity analyzer needs it.
  let buffer;
  if (activeAnalyzers.some((analyzer) => analyzer.analyzer_category === 'proximity')) {
    ({ default: buffer } = await import('@turf/buffer'));
  }

  // ...and one unusable analyzer shouldn't discard the rest of the list
  const settled = await Promise.allSettled(activeAnalyzers.map(async (analyzer) => ({
    id: analyzer.id,
    name: analyzer.name,
    type: analyzer.analyzer_category,
    geojson: featureCollection(await fetchAnalyzerFeatures(analyzer, buffer)),
  })));

  // a cancelled request means the app is tearing this fetch down, not that the
  // analyzers are bad — leave the existing list in place rather than replacing
  // it with a partial one
  if (settled.some(({ reason, status }) => status === 'rejected' && isCancel(reason))) return;

  const analyzers = settled.reduce((accumulator, result, index) => {
    if (result.status === 'rejected') {
      warnAnalyzerFailure(activeAnalyzers[index], result.reason);

      return accumulator;
    }

    return result.value.geojson.features.length ? [...accumulator, result.value] : accumulator;
  }, []);

  dispatch({
    type: FETCH_ANALYZERS_SUCCESS,
    payload: analyzers,
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
