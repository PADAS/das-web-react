import { findAnalyzerIdByChildFeatureId } from './analyzers';

const analyzerWithFeatureIds = (id, ...featureIds) => ({
  geojson: { features: featureIds.map((featureId) => ({ properties: { id: featureId } })) },
  id,
});

describe('utils - analyzers', () => {
  describe('findAnalyzerIdByChildFeatureId', () => {
    const analyzers = [
      analyzerWithFeatureIds('analyzer-a', 'feature-1', 'feature-2'),
      analyzerWithFeatureIds('analyzer-b', 'feature-3'),
    ];

    test('finds the analyzer owning the feature', () => {
      expect(findAnalyzerIdByChildFeatureId('feature-3', analyzers)).toBe('analyzer-b');
    });

    test('finds an analyzer by a feature other than its first', () => {
      expect(findAnalyzerIdByChildFeatureId('feature-2', analyzers)).toBe('analyzer-a');
    });

    test('returns null when no analyzer owns the feature', () => {
      expect(findAnalyzerIdByChildFeatureId('feature-absent', analyzers)).toBeNull();
    });

    test('returns null without any analyzers', () => {
      expect(findAnalyzerIdByChildFeatureId('feature-1')).toBeNull();
    });
  });
});
