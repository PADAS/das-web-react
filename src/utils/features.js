
import uniq from 'lodash/uniq';

export const getUniqueIDsFromFeatures = (...features) => uniq(features.map(({ properties: { pk } }) => pk));
export const getUniqueIDsFromFeatureSets = (...featureSets) => getUniqueIDsFromFeatures(featureSets.reduce((accumulator, set) => [...accumulator, ...set.features], []));

export const setDirectMapBindingsForFeatureHighlightStates = (map) => {
  map.on('mousemove', 'state', () => console.log('boo'));
};