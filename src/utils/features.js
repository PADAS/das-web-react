
import uniq from 'lodash/uniq';
import { LngLatBounds } from 'mapbox-gl';

import { LAYER_IDS } from '../constants';
import { featureSets } from '../selectors';

const { FEATURE_FILLS, FEATURE_LINES, FEATURE_SYMBOLS } = LAYER_IDS;
const MAX_JUMP_ZOOM = 17;

export const getUniqueIDsFromFeatures = (...features) => uniq(features.map(({ properties: { id } }) => id));
export const getUniqueIDsFromFeatureSets = (...featureSets) => getUniqueIDsFromFeatures(featureSets.reduce((accumulator, set) => [...accumulator, ...set.features], []));

export const setDirectMapBindingsForFeatureHighlightStates = (map) => {
  map.on('mousedown', () => map.queryRenderedFeatures({ layers: [FEATURE_FILLS, FEATURE_LINES] }).forEach(f => map.setFeatureState(f, { 'active': false })));
};

const getBoundsForArrayOfCoordinatePairs = (collection) => collection.reduce((bounds, coords) => {
  return bounds.extend(coords);
}, new LngLatBounds(collection[0], collection[0]));


const jumpAndFitBounds = (map, bounds) => map.fitBounds(bounds, { duration: 0, maxZoom: MAX_JUMP_ZOOM, padding: 30 });

const fitMapBoundsToPoint = (map, geojson) => jumpAndFitBounds(map, new LngLatBounds(geojson.geometry.coordinates));
const fitMapBoundsToLineString = (map, geojson) => jumpAndFitBounds(map,
  getBoundsForArrayOfCoordinatePairs(geojson.geometry.coordinates)
);
const fitMapBoundsToMultiPoint = (map, geojson) => fitMapBoundsToLineString(map, geojson);
const fitMapBoundsToPolygon = (map, geojson) => fitMapBoundsToLineString(map, geojson);
const fitMapBoundsToMultiLineString = (map, geojson) => jumpAndFitBounds(map,
  geojson.geometry.coordinates.reduce((bounds, lineCoordinates) => {
    return bounds.extend(getBoundsForArrayOfCoordinatePairs(lineCoordinates));
  }, new LngLatBounds(geojson.geometry.coordinates[0][0], geojson.geometry.coordinates[0][0]))
);

const fitMapBoundsToMultiPolygon = (map, geojson) => {
  jumpAndFitBounds(map, geojson.geometry.coordinates.reduce((bounds, coords) =>
    bounds.extend(
      coords.reduce((b, coordinateArray) =>
        b.extend(
          getBoundsForArrayOfCoordinatePairs(coordinateArray)
        ), new LngLatBounds(coords[0][0], coords[0][0])),
    ), new LngLatBounds(geojson.geometry.coordinates[0][0][0], geojson.geometry.coordinates[0][0][0])
  ));
};

export const fitMapBoundsToGeoJson = (map, geojson) => {
  const { geometry: { type } } = geojson;

  if (type === 'Point') return fitMapBoundsToPoint(map, geojson);
  if (type === 'MultiPoint') return fitMapBoundsToMultiPoint(map, geojson);
  if (type === 'LineString') return fitMapBoundsToLineString(map, geojson);
  if (type === 'MultiLineString') return fitMapBoundsToMultiLineString(map, geojson);
  if (type === 'Polygon') return fitMapBoundsToPolygon(map, geojson);
  if (type === 'MultiPolygon') return fitMapBoundsToMultiPolygon(map, geojson);
};

export const setFeatureActiveStateByID = (map, id, state = true) => {
  const features = map.queryRenderedFeatures({
    filter: ['in', 'id', id],
    layers: [FEATURE_FILLS, FEATURE_LINES],
  });
  features.forEach((feature) => {
    map.setFeatureState(feature, { 'active': state });
  });
};

/**
 * filterFeatures is a recursive function to drill down a featureset 
 * tree to filter for features matching the search filter as given by the 
 * function isMatch.
 * @param {Object} f either a featureset, featureType, or feature. 
 * @param {function} isMatch function to check if feature matches the filter.
 */
export const filterFeatures = (f, isMatch) => {
  let newF = [];
  if (f.featuresByType) { // a featureset obj has featuresByType array
    newF = { ...f, featuresByType: f.featuresByType.map(fbt => filterFeatures(fbt, isMatch)) };
    newF.featuresByType = newF.featuresByType.filter(fbt => !!fbt.features.length);
  }
  else if (f.features) { // a featuresByType obj has features array:
    newF = { ...f, features: f.features.filter(isMatch) };
  }
  else { // top level featureset array:
    newF = f.map(fs => filterFeatures(fs, isMatch));
    newF = newF.filter(fs => !!fs.featuresByType.length);
  }
  return newF;
};

export const getAllFeatureIDsInList = (featureList) => getUniqueIDsFromFeatures(...featureList
  .reduce((accumulator, { featuresByType }) =>
    [...accumulator,
    ...featuresByType.reduce((result, { features }) => [...result, ...features], [])
    ], [])
);

export const getFeatureSymbolAtPoint = (geo, map) => {
  const features = map.queryRenderedFeatures(geo, {
    layers: [FEATURE_SYMBOLS],
  });
  return features[0].properties;
};
