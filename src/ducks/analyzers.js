import { API_URL } from '../constants';
import axios, { isCancel } from 'axios';
import { buffer, featureCollection } from '@turf/turf';

import globallyResettableReducer from '../reducers/global-resettable';

export const ANALYZERS_API_URL = `${API_URL}analyzers/spatial`;

// actions
export const FETCH_ANALYZERS_SUCCESS = 'FETCH_ANALYZERS_SUCCESS';
export const FETCH_ANALYZERS_ERROR = 'FETCH_ANALYZERS_ERROR';

const DEFAULT_PROXIMITY_ANALYZER_DISPLAY_RADIUS = 500; // meters
const PROXIMITY_BUFFER_STEPS = 32;
const METERS_PER_KILOMETER = 1000;

let featureLayerIdentifier = 1000;

const warnAnalyzerFailure = (analyzer, error, spatialGroupName) => {
  const location = spatialGroupName ? ` spatial group "${spatialGroupName}" of` : '';

  console.warn(`error processing${location} analyzer "${analyzer?.name}" (${analyzer?.id})`, error);
};

const unbufferableError = (feature, radiusMeters) =>
  new Error(`could not buffer ${feature.geometry.type} geometry by ${radiusMeters}m`);

// Proximity analyzers display as a footprint buffered around their source geometry by the
// analyzer's trigger distance.
const proximityFootprintGeometry = (feature, thresholdDistMeters) => {
  const radiusMeters = thresholdDistMeters ?? DEFAULT_PROXIMITY_ANALYZER_DISPLAY_RADIUS;

  // Turf shrinks a polygon for a non-positive distance instead of refusing it, which would
  // draw a footprint smaller than the geometry it is meant to cover.
  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) throw unbufferableError(feature, radiusMeters);

  const footprint = buffer(feature, radiusMeters / METERS_PER_KILOMETER, {
    steps: PROXIMITY_BUFFER_STEPS,
    units: 'kilometers',
  });

  // Turf yields no geometry for input it cannot buffer, which would surface as a TypeError
  // further downstream.
  if (!footprint?.geometry) throw unbufferableError(feature, radiusMeters);

  return footprint.geometry;
};

const toAnalyzerLayerFeature = (spatialFeature, analyzer, spatialGroupName) => {
  const feature = spatialFeature?.features?.[0];

  if (!feature?.geometry) throw new Error('spatial feature carries no geometry');

  feature.id = featureLayerIdentifier++;

  if (analyzer.analyzer_category === 'proximity') {
    feature.geometry = proximityFootprintGeometry(feature, analyzer?.threshold_dist_meters);
  }

  feature.properties.admin_href = analyzer.admin_href;
  feature.properties.title = analyzer.name;
  feature.properties.analyzer_type = analyzer.analyzer_category;
  feature.properties.spatial_group = `${feature.geometry.type}.${spatialGroupName}`;
  feature.properties.id = feature.properties.pk;

  return feature;
};

// One unusable feature shouldn't discard the rest of its spatial group, so every entry is
// converted inside the try — a malformed one throws where it can be isolated.
const fetchSpatialGroupFeatures = async (analyzer, [spatialGroupName, url]) => {
  const { data: { data: { features: spatialGroupFeatures } } } = await axios.get(url);

  return spatialGroupFeatures.reduce((accumulator, spatialFeature) => {
    try {
      accumulator.features.push(toAnalyzerLayerFeature(spatialFeature, analyzer, spatialGroupName));
    } catch (error) {
      accumulator.hasFailures = true;
      warnAnalyzerFailure(analyzer, error, spatialGroupName);
    }

    return accumulator;
  }, { features: [], hasFailures: false });
};

// One unusable spatial group shouldn't discard its sibling groups.
const fetchAnalyzerFeatures = async (analyzer) => {
  const spatialGroupLinks = Object.entries(analyzer.spatial_groups).filter(([, url]) => url !== null);
  const settled = await Promise.allSettled(
    spatialGroupLinks.map((link) => fetchSpatialGroupFeatures(analyzer, link))
  );

  return settled.reduce((accumulator, result, index) => {
    if (result.status === 'fulfilled') {
      return {
        features: [...accumulator.features, ...result.value.features],
        hasFailures: accumulator.hasFailures || result.value.hasFailures,
      };
    }

    if (isCancel(result.reason)) throw result.reason;

    warnAnalyzerFailure(analyzer, result.reason, spatialGroupLinks[index][0]);

    return { ...accumulator, hasFailures: true };
  }, { features: [], hasFailures: false });
};

// action creator - fetches the analyzer list, and then
// aggregates the features in that list and displayed in a AnalyzerLayer
export const fetchAnalyzers = () => async (dispatch) => {
  let activeAnalyzers;

  // fetch the active analyzers, only processing the non-null spatial group urls
  try {
    ({ data: { data: activeAnalyzers } } = await axios.get(ANALYZERS_API_URL, { params: { active: true } }));
  } catch (error) {
    if (isCancel(error)) return;

    console.warn('error fetching the analyzer list', error);

    return dispatch({ type: FETCH_ANALYZERS_ERROR });
  }

  if (!Array.isArray(activeAnalyzers)) {
    console.warn('the analyzer list response carried no analyzers', activeAnalyzers);

    return dispatch({ type: FETCH_ANALYZERS_ERROR });
  }

  // One unusable analyzer shouldn't discard the rest of the list.
  const settled = await Promise.allSettled(activeAnalyzers.map(async (analyzer) => {
    const { features, hasFailures } = await fetchAnalyzerFeatures(analyzer);

    return {
      geojson: featureCollection(features),
      hasFailures,
      id: analyzer.id,
      name: analyzer.name,
      type: analyzer.analyzer_category,
    };
  }));

  // A cancelled request means the app is tearing this fetch down, not that the analyzers are
  // bad, so leave the existing list in place rather than replacing it with a partial one.
  if (settled.some(({ reason, status }) => status === 'rejected' && isCancel(reason))) return;

  const { analyzers, hasFailures } = settled.reduce((accumulator, result, index) => {
    if (result.status === 'rejected') {
      warnAnalyzerFailure(activeAnalyzers[index], result.reason);

      return { ...accumulator, hasFailures: true };
    }

    const { geojson, hasFailures: analyzerHasFailures, ...analyzer } = result.value;

    return {
      analyzers: geojson.features.length
        ? [...accumulator.analyzers, { ...analyzer, geojson }]
        : accumulator.analyzers,
      hasFailures: accumulator.hasFailures || analyzerHasFailures,
    };
  }, { analyzers: [], hasFailures: false });

  return dispatch({
    type: FETCH_ANALYZERS_SUCCESS,
    payload: { analyzers, hasFailures },
  });
};

const INITIAL_ANALYZER_FEATURE_STATE = { data: [], hasFailures: false };
// reducer
const analyzersReducer = (state, action) => {
  const { payload, type } = action;

  if (type === FETCH_ANALYZERS_SUCCESS) {
    // This slice is persisted, so an all-failed load would otherwise blank the map overlays
    // and outlive the outage that caused it.
    const keepsExistingData = payload.hasFailures && !payload.analyzers.length && !!state.data.length;

    return {
      data: keepsExistingData ? state.data : payload.analyzers,
      hasFailures: payload.hasFailures,
    };
  }

  if (type === FETCH_ANALYZERS_ERROR) {
    return { ...state, hasFailures: true };
  }

  return state;
};

export default globallyResettableReducer(analyzersReducer, INITIAL_ANALYZER_FEATURE_STATE);
