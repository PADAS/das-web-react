import { createSelector } from 'reselect';

import { analyzerFeatures } from '../../selectors';
import { getBoundsForAnalyzerFeatures } from '../../utils/analyzers';

export const getAnalyzerListState = createSelector(
  [(...args) => analyzerFeatures(...args)],
  (analyzerFeatures) => {
    const features = (analyzerFeatures).map((analyzer) => {
      // aggregate the feature ids, and store them in the first feature,
      // so that we can be FeatureLayerList compatible, but still know 
      // what features are related. 
      const analyzerFeatures = analyzer.geojson.features.reduce((accumulator, feature) => {
        accumulator.push(feature.properties.id);
        return accumulator;
      }, []);
      // Likewise, precalc the bounds, as we wont have access to all 
      // of the features at selection time in the feature list itm
      const bounds = getBoundsForAnalyzerFeatures(analyzer.geojson);
      const feature = analyzer.geojson.features[0];
      feature.properties.type_name = analyzer.name;
      feature.properties.id = feature.properties.pk;
      feature.properties.feature_group = analyzerFeatures;
      feature.properties.feature_bounds = bounds;

      return { id: analyzer.id, name: analyzer.name, features: [feature] };
    });
    return ([{ name: 'Analyzers', id: 'analyzers', features }]);
  });



