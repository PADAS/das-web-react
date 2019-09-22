import { centroid, circle, bbox } from '@turf/turf';
import { featureCollection } from '@turf/helpers';
import { LAYER_IDS } from '../constants';

const { ANALYZER_POLYS_WARNING, ANALYZER_POLYS_CRITICAL, 
  ANALYZER_LINES_CRITICAL, ANALYZER_LINES_WARNING } = LAYER_IDS;
const MAX_JUMP_ZOOM = 17;

export const calcAnalyzerLayerId = (layer) => {
    if (layer.includes('-polys-')) return `${layer}-fill`;
    if (layer.includes('-lines-')) return `${layer}-line`;
    return layer;
  };

const analyzerLayerIds = [calcAnalyzerLayerId(ANALYZER_POLYS_WARNING), calcAnalyzerLayerId(ANALYZER_POLYS_CRITICAL),
                          calcAnalyzerLayerId(ANALYZER_LINES_CRITICAL), calcAnalyzerLayerId(ANALYZER_LINES_WARNING)];

const getAnalyzerFeaturesForId = (map, id) => {
  const features = map.queryRenderedFeatures({
    filter: ['in', 'id', id],
    layers: analyzerLayerIds,
  });
  return features;
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

export const getBoundsForAnalyzerFeatures = (features) => {
  const bounds = bbox(features);
  return bounds;
};

export const fitMapBoundsForAnalyzer = (map, bounds) => {
  console.log('bounds for fit', bounds);
  map.fitBounds(bounds, { duration: 0, padding: 30 });
};

export const getAnalyzerAdminPoint = (geometry) => {
  return centroid(geometry);
};

// use turf.circle to construct a GEOJson Feature of type polygon
// increase/decrease steps will affect the render fps
export const createGeoJSONCircle = (center, radius, options) => {
  if(!options) options = {steps: 32, units: 'kilometers'};
  const poly_circle = circle(center, radius/1000, options);
  return poly_circle;
};

export const analyzerSourceLayerMap = {
  'LineString.warning_group' : ANALYZER_LINES_WARNING,
  'MultiLineString.warning_group' : ANALYZER_LINES_WARNING,
  'LineString.critical_group' : ANALYZER_LINES_CRITICAL,
  'MultiLineString.critical_group' : ANALYZER_LINES_WARNING,
  'Polygon.critical_group' : ANALYZER_POLYS_CRITICAL,
  'Polygon.warning_group' : ANALYZER_POLYS_WARNING,
  'Polygon.proximity_group' : ANALYZER_POLYS_WARNING,
  'MultiPolygon.warning_group' : ANALYZER_POLYS_WARNING,
  'MultiPolygon.critical_group' : ANALYZER_POLYS_CRITICAL
}