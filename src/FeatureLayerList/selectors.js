import uniq from 'lodash/uniq';
import { createSelector } from 'reselect';

import { featureSets } from '../selectors';

export const getFeatureLayerListState = createSelector(
  [(state, props) => featureSets(state, props)],
  (featureSets) => featureSets.map((set) => {
    const typeNames = uniq(set.geojson.features.map(f => f.properties.type_name));
    const featuresByType = typeNames.map((name) => ({
      name,
      features: set.geojson.features.filter(f => f.properties.type_name === name),
    }));
    return ({
      name: set.name,
      id: set.id,
      featuresByType,
    });
  }),
);
