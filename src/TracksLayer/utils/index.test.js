import { buildFeatureCollectionOfTwoPointLineStringSegments } from '../../utils/tracks';
import {
  generateMapSourcesAndLayersBasedOnTwoLineTrackPointsSegments,
  segmentTrackPointsByTimeOfDayPeriodPairs
} from './';

describe('TracksLayer - utils', () => {
  const track = {
    'type': 'FeatureCollection',
    'features': [
      {
        'type': 'Feature',
        'geometry': {
          'type': 'LineString',
          'coordinates': [
            [
              -109.41014560634443,
              -27.166035291320892
            ],
            [
              -109.41937192180515,
              -27.161194427154097
            ],
            [
              -109.42032127709739,
              -27.17047350291985
            ],
            [
              -109.37653132599918,
              -27.08924213333757
            ],
            [
              -109.38397002503892,
              -27.114204665851712
            ]
          ]
        },
        'properties': {
          'coordinateProperties': {
            'times': [
              '2025-02-27T21:42:01+00:00',
              '2025-02-24T06:06:05+00:00',
              '2025-02-24T03:58:02+00:00',
              '2025-02-17T00:16:01+00:00',
              '2025-02-14T12:24:01+00:00'
            ]
          }
        }
      }
    ]
  };
  const twoPointLineStringTrackPoints = buildFeatureCollectionOfTwoPointLineStringSegments(track, 'America/Monterrey');
  const segmentPairs = segmentTrackPointsByTimeOfDayPeriodPairs(twoPointLineStringTrackPoints);

  test('segments track points by pairs of time of day periods', () => {
    const layoutOptions =  {
      'line-join': 'round',
      'line-cap': 'round',
    };
    const layerOptions = {
      before: 'subject-symbol-layer'
    };
    const sourceId = 'aSourceId';
    const layerId = 'aLayerId';
    const trackData = { twoPointLineStringTrackPoints };
    const configs = generateMapSourcesAndLayersBasedOnTwoLineTrackPointsSegments(trackData, true, sourceId, layerId, layoutOptions, layerOptions);

    expect(configs.hasTimeOfDaySegments).toBe(true);

    Object.entries(segmentPairs).forEach(([pairKey, segment], index) => {
      const [startColor, endColor] = pairKey.split('|');
      const segmentSourceId = `${sourceId}-colorpair-${index}`;
      const sourceConfig = configs.sourcesConfigs.find((source) => source.id === segmentSourceId);
      const segmentLayerId = `${layerId}-colorpair-${index}`;
      const layerConfig = configs.layersConfigs.find((layer) => layer.id === segmentLayerId);
      const [
        interpolate,
        linear,
        lineProgress,
        firstStop,
        firstStopColor,
        secondStop,
        secondStopColor
      ] = layerConfig.paint['line-gradient'];


      expect(sourceConfig.data.type).toBe('FeatureCollection');
      expect(sourceConfig.data.features).toStrictEqual(segment);

      expect(layerConfig.type).toBe('line');
      expect(layerConfig.sourceId).toBe(segmentSourceId);
      expect(layerConfig.layout).toStrictEqual(layoutOptions);
      expect(layerConfig.options).toStrictEqual(layerOptions);

      expect(interpolate).toBe('interpolate');
      expect(linear).toStrictEqual(['linear']);
      expect(lineProgress).toStrictEqual(['line-progress']);
      expect(firstStop).toBe(0);
      expect(firstStopColor).toBe(startColor);
      expect(secondStop).toBe(1);
      expect(secondStopColor).toBe(endColor);
    });
  });
});