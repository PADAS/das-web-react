import { featureSets, analyzerFeatures, createSelector } from '../selectors';

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

export const getAnalyzerListState = createSelector(
  [analyzerFeatures, hiddenFeatureIDs],
  (analyzerFeatures, hiddenFeatureIDs) => {
    const featuresByType = (analyzerFeatures).map( (analyzer) => {
      const feature = analyzer.geojson.features[0];
      feature.properties.type_name = analyzer.name;
      feature.properties.id = feature.properties.pk;
      return {name: analyzer.name, features: [feature]};
    });
    return ([{name: 'Analyzers', id:'analyzers', featuresByType }]);
  });

