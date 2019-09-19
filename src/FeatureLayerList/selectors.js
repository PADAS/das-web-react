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
  [analyzerFeatures],
  (analyzerFeatures) => {
    const featuresByType = (analyzerFeatures).map( (analyzer) => {
      // aggregate the feature ids, and store them in the first feature,
      // so that we can be FeatureLayerList compatible
      const analyzerFeatures = analyzer.geojson.features.reduce((accumulator, feature) => {
        accumulator.push(feature.properties.id);
        return accumulator;
      }, []);
      const feature = analyzer.geojson.features[0];
      feature.properties.type_name = analyzer.name;
      feature.properties.id = feature.properties.pk;
      feature.properties.feature_group = analyzerFeatures;
      return {name: analyzer.name, features: [feature]};
    });
    return ([{name: 'Analyzers', id:'analyzers', featuresByType }]);
  });

