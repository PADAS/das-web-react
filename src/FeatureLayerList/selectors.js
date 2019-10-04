import uniq from 'lodash/uniq';

import { featureSets, analyzerFeatures, createSelector } from '../selectors';
import { getBoundsForAnalyzerFeatures } from '../utils/analyzers';

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
    });
  }),
);

export const getAnalyzerListState = createSelector(
  [analyzerFeatures],
  (analyzerFeatures) => {
    const features = (analyzerFeatures).map( (analyzer) => {
      // aggregate the feature ids, and store them in the first feature,
      // so that we can be FeatureLayerList compatible, but still know 
      // what features are related. 
      const analyzerFeatures = analyzer.geojson.features.reduce((accumulator, feature) => {
        accumulator.push(feature.properties.id);
        return accumulator;
      }, []);
      // Likewise, precalc the bounds, as we wont have access to all 
      // of the features at selection time in the feature list item
      const bounds = getBoundsForAnalyzerFeatures(analyzer.geojson);
      const feature = analyzer.geojson.features[0];
      feature.properties.type_name = analyzer.name;
      feature.properties.id = feature.properties.pk;
      feature.properties.feature_group = analyzerFeatures;
      feature.properties.feature_bounds = bounds;
      return feature;
    });
    const typeNames = uniq(analyzerFeatures.map(analyzer => analyzer.type));
    const featuresByType = typeNames.map((name) => ({
      name,
      features: features.filter(f => f.analyzer_type === name),
    }));
    return ([{name: 'Analyzers', id:'analyzers', featuresByType }]);
  });

