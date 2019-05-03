import { featureSets } from '../selectors';
import { createSelector } from 'reselect';

import uniq from 'lodash/uniq';

const hiddenFeatureIDs = ({ view: { hiddenFeatureIDs } }) => hiddenFeatureIDs;

export const getFeatureLayerListState = createSelector(
  [featureSets, hiddenFeatureIDs],
  (featureSets, hiddenFeatureIDs) => featureSets.map((set) => {
    const typeNames = uniq(set.geojson.features.map(f => f.properties.type_name));
    const featuresByType = typeNames.map((name) => ({
      name,
      features: set.geojson.features.filter(f => f.properties.type_name === name),
    }));
    return ({
      name: set.name,
      id: set.id,
      featuresByType,
    })
  }),
);