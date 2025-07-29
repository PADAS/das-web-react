import groupBy from 'lodash/groupBy';
import { createSelector } from 'reselect';

import { featureSets } from '../../../selectors';

export const getFeatureLayerListState = createSelector(
  [(state, props) => featureSets(state, props)],
  (featureSets) => featureSets.map((set) => {
    const groupedFeatures = groupBy(set.geojson.features, 'properties.type_name');
    const featuresByType = Object.entries(groupedFeatures).map(([name, features]) => ({
      name,
      features,
    }));
    return ({
      name: set.name,
      id: set.id,
      featuresByType,
    });
  }),
);
