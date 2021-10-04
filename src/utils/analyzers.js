import { bbox, bboxPolygon, circle, centroid } from '@turf/turf';
import { LAYER_IDS, SOURCE_IDS } from '../constants';


const { ANALYZER_POLYS_WARNING, ANALYZER_POLYS_CRITICAL,
  ANALYZER_LINES_CRITICAL, ANALYZER_LINES_WARNING } = LAYER_IDS;
const { ANALYZER_POLYS_WARNING_SOURCE, ANALYZER_POLYS_CRITICAL_SOURCE,
  ANALYZER_LINES_CRITICAL_SOURCE, ANALYZER_LINES_WARNING_SOURCE } = SOURCE_IDS;
const MAX_JUMP_ZOOM = 17;

const analyzerLayerIds = [ANALYZER_POLYS_WARNING, ANALYZER_POLYS_CRITICAL,
  ANALYZER_LINES_CRITICAL, ANALYZER_LINES_WARNING];

const getAnalyzerFeaturesForId = (map, id) => {
  const features = map.queryRenderedFeatures({
    filter: ['in', 'id', id],
    layers: analyzerLayerIds,
  });
  return features;
};

// currently, we can't remove a specific state property, ie the 'active' state,
// as it appears a feature id is required to remove it via this call
export const clearActiveAnalyzerFeatures = (map) => {
  map.removeFeatureState({ source: ANALYZER_POLYS_WARNING_SOURCE });
  map.removeFeatureState({ source: ANALYZER_POLYS_CRITICAL_SOURCE });
  map.removeFeatureState({ source: ANALYZER_LINES_CRITICAL_SOURCE });
  map.removeFeatureState({ source: ANALYZER_LINES_WARNING_SOURCE });
};

export const setAnalyzerFeatureActiveStateByID = (map, id, state = true) => {
  const features = getAnalyzerFeaturesForId(map, id);
  features.forEach((feature) => {
    map.setFeatureState(feature, { 'active': state });
  });
};

export const setAnalyzerFeatureActiveStateForIDs = (map, ids, state = true) => {
  ids.forEach((id) => {
    setAnalyzerFeatureActiveStateByID(map, id, state);
  });
};

export const getAnalyzerFeaturesAtPoint = (map, geo) => {
  const features = map.queryRenderedFeatures(geo, {
    layers: analyzerLayerIds,
  });
  return features;
};

// this assumes a FeatureCollection. It appears that if you
// add a type option of 'FeatureCollection' the bbox call fails.
export const getBoundsForAnalyzerFeatures = (features) => {
  const bounds = bbox(features);
  return bounds;
};

export const fitMapBoundsForAnalyzer = (map, bounds) => {
  map.fitBounds(bounds, { duration: 0, maxZoom: MAX_JUMP_ZOOM, padding: 80 });
};

export const getAnalyzerAdminPoint = (geometry) => {
  const poly = bboxPolygon(geometry);
  const centerPt = centroid(poly);
  return centerPt.geometry.coordinates;
};

// use turf.circle to construct a GEOJson Feature of type polygon
// increase/decrease steps will affect the render fps
export const createGeoJSONCircle = (geometry, radius, options) => {
  if (!options) options = { steps: 32, units: 'kilometers' };
  const poly_circle = circle(centroid(geometry), radius / 1000, options);
  return poly_circle;
};

export const findAnalyzerIdByChildFeatureId = (featureId, analyzerFeatures) => {
  const analyzers = analyzerFeatures?.data ?? [];
  const searchResult = analyzers.find((analyzer) => analyzer.geojson.features.some(f => f.properties.id === featureId));
  return searchResult ? searchResult.id : null;
};

export const analyzerSourceLayerMap = {
  'LineString.warning_group': ANALYZER_LINES_WARNING,
  'MultiLineString.warning_group': ANALYZER_LINES_WARNING,
  'LineString.critical_group': ANALYZER_LINES_CRITICAL,
  'MultiLineString.critical_group': ANALYZER_LINES_WARNING,
  'Polygon.critical_group': ANALYZER_POLYS_CRITICAL,
  'Polygon.warning_group': ANALYZER_POLYS_WARNING,
  'Polygon.proximity_group': ANALYZER_POLYS_WARNING,
  'MultiPolygon.warning_group': ANALYZER_POLYS_WARNING,
  'MultiPolygon.critical_group': ANALYZER_POLYS_CRITICAL
};