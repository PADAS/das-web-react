import { buildTrackSegments } from '../../utils/tracks';
import { segmentTrackPointsByTimeOfDayPeriodPairs } from './';

describe('TracksLayer - utils', () => {
  const trackSegments = buildTrackSegments({
    features: [{
      geometry: {
        coordinates: [
          [-109.41014560634443, -27.166035291320892],
          [-109.41937192180515, -27.161194427154097],
          [-109.42032127709739, -27.17047350291985],
          [-109.37653132599918, -27.08924213333757],
          [-109.38397002503892, -27.114204665851712],
        ],
        type: 'LineString',
      },
      properties: {
        coordinateProperties: {
          times: [
            '2025-02-27T21:42:01+00:00',
            '2025-02-24T06:06:05+00:00',
            '2025-02-24T03:58:02+00:00',
            '2025-02-17T00:16:01+00:00',
            '2025-02-14T12:24:01+00:00',
          ],
        },
      },
      type: 'Feature',
    }],
    type: 'FeatureCollection',
  }, 'America/Monterrey');

  test('groups the segments of a track under the pair of colors they run between', () => {
    const segmentsByColorPair = segmentTrackPointsByTimeOfDayPeriodPairs(trackSegments);

    expect(Object.keys(segmentsByColorPair).length).toBeGreaterThan(0);

    Object.entries(segmentsByColorPair).forEach(([colorPairKey, segments]) => {
      const [startColor, endColor] = colorPairKey.split('|');

      segments.forEach((segment) => {
        expect(segment.properties.startColor).toBe(startColor);
        expect(segment.properties.endColor).toBe(endColor);
      });
    });
  });

  test('accounts for every segment that carries both of its colors', () => {
    const segmentsByColorPair = segmentTrackPointsByTimeOfDayPeriodPairs(trackSegments);

    expect(Object.values(segmentsByColorPair).flat()).toHaveLength(
      trackSegments.features.filter(
        (feature) => feature.properties?.startColor && feature.properties?.endColor
      ).length
    );
  });

  test('leaves out a segment that is missing one of its colors', () => {
    const segmentsByColorPair = segmentTrackPointsByTimeOfDayPeriodPairs({
      features: [
        { properties: { endColor: '#000000', startColor: '#ffffff' }, type: 'Feature' },
        { properties: { startColor: '#ffffff' }, type: 'Feature' },
        { properties: {}, type: 'Feature' },
      ],
      type: 'FeatureCollection',
    });

    expect(Object.values(segmentsByColorPair).flat()).toHaveLength(1);
  });
});
