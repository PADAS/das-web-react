
import uniq from 'lodash/uniq';
import { LngLatBounds } from 'mapbox-gl';

import { LAYER_IDS } from '../constants';

const { FEATURE_FILLS, FEATURE_LINES } = LAYER_IDS;
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
 * hasFeatureMatch is a recursive function to drill down the featureset 
 * tree to find if there are features matching the search filter as given by
 * the function featureMatchesFilter.
 * @param {Object} features either a featureset, featureType, or feature. 
 * @param {function} featureMatchesFilter function to check if feature matches the filter.
 */
const hasFeatureMatch = (features, featureMatchesFilter) => {
  if (features.type)           // feature:
    return featureMatchesFilter(features);
  if (features.featuresByType) // featureset:
    return features.featuresByType.some(featuresByType => hasFeatureMatch(featuresByType, featureMatchesFilter));
  if (features.features)       // featuresByType:
    return features.features.some(feature => hasFeatureMatch(feature, featureMatchesFilter));
  return false;
};

/**
 * filterFeaturesets is a function that filters a given featureset array based on 
 * the recursive hasFeatureMatch predicate function given the filter function 
 * featureMatchesFilter that does the actual filter matching of the feature.
 * @param {array} features array of featureset, featureType, or feature.
 * @param {*} featureMatchesFilter  filter function to determine if feature matches filter criteria.
 */
export const filterFeaturesets = (features, featureMatchesFilter) => {
  return features.filter(feature => hasFeatureMatch(feature, featureMatchesFilter))
};