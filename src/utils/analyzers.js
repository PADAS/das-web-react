import { circle } from '@turf/turf';
import { LAYER_IDS } from '../constants';

const { ANALYZER_POLYS_WARNING, ANALYZER_POLYS_CRITICAL, 
  ANALYZER_LINES_CRITICAL, ANALYZER_LINES_WARNING } = LAYER_IDS;

export const calcAnalyzerLayerId = (layer) => {
    if (layer.includes('-polys-')) return `${layer}-fill`;
    if (layer.includes('-lines-')) return `${layer}-line`;
    return layer;
  };

const analyzerLayerIds = [calcAnalyzerLayerId(ANALYZER_POLYS_WARNING), calcAnalyzerLayerId(ANALYZER_POLYS_CRITICAL),
                          calcAnalyzerLayerId(ANALYZER_LINES_CRITICAL), calcAnalyzerLayerId(ANALYZER_LINES_WARNING)];

export const setAnalyzerFeatureActiveStateByID = (map, ids, state = true) => {
  const features = map.queryRenderedFeatures({
    filter: ['in', 'id', ids],
    layers: analyzerLayerIds,
  });
  features.forEach((feature) => {
    map.setFeatureState(feature, { 'active': state });
  });
};

export const getAnalyzerFeaturesAtPoint = (map, geo) => {
  const features = map.queryRenderedFeatures(geo, {
    layers: analyzerLayerIds,
  });
  return features;
};

export const showAnalyzerAdmin = (map, id, state = true) => {
  console.log('TODO: show analyzer admin');
};

// use turf.circle to construct a GEOJson Feature of type polygon
// increase/decrease steps will affect the render fps
export const createGeoJSONCircle = (center, radius, options) => {
  if(!options) options = {steps: 64, units: 'kilometers'};
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
  'MultiPolygon.warning_group' : ANALYZER_POLYS_WARNING,
  'MultiPolygon.critical_group' : ANALYZER_POLYS_CRITICAL
}