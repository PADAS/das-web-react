import { createSelector } from 'reselect';

import { featureSets } from '../../../selectors';

export const getFeatureLayerListState = createSelector(
  [(state, props) => featureSets(state, props)],
  (featureSets) => featureSets
    .reduce((result, set, _index) => {
      if (!set.types.length) return result;

      const featuresByType = set.types
        .reduce((accumulator, type, _index) => {
          if (!type.feature_count) return accumulator;

          accumulator.push({
            name: type.name,
            features: type.feature_summaries,
          });

          return accumulator;

        }, []);

      result.push({
        name: set.name,
        id: set.id,
        featuresByType,
      });

      return result;
    }, []),
);
