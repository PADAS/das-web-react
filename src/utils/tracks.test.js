import axios from 'axios';

import {
  buildTrackSegments,
  countTrackPointsInFeatureCollection,
  fetchTrackPointCount,
  findClosestPositionDescending,
  getTimeOfDayPeriodBasedOnTime,
  fixAntimeridianCrossing,
  getVtRangeParam,
} from './tracks';

import { TIME_OF_DAY_PERIODS } from '../constants';

describe('utils - tracks', () => {
  describe('countTrackPointsInFeatureCollection', () => {
    test('returns 0 for empty or missing features', () => {
      expect(countTrackPointsInFeatureCollection(null)).toBe(0);
      expect(countTrackPointsInFeatureCollection({})).toBe(0);
      expect(countTrackPointsInFeatureCollection({ features: [] })).toBe(0);
    });

    test('counts coordinates in LineString features', () => {
      const fc = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1], [2, 2]] },
          },
          {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: [[3, 3], [4, 4]] },
          },
        ],
      };
      expect(countTrackPointsInFeatureCollection(fc)).toBe(5);
    });

    test('ignores features without geometry', () => {
      const fc = {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: {} },
          { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] } },
        ],
      };
      expect(countTrackPointsInFeatureCollection(fc)).toBe(2);
    });
  });

  describe('fetchTrackPointCount', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('returns 0 without subjects or start date', async () => {
      await expect(fetchTrackPointCount([], new Date('2020-01-01'), new Date('2020-01-02'))).resolves.toBe(0);
      await expect(fetchTrackPointCount(['a'], null, new Date('2020-01-02'))).resolves.toBe(0);
    });

    test('sums points from parallel track API responses', async () => {
      jest.spyOn(axios, 'get').mockResolvedValue({
        data: {
          data: {
            type: 'FeatureCollection',
            features: [{ geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1], [2, 2]] } }],
          },
        },
      });
      const total = await fetchTrackPointCount(
        ['sub-a', 'sub-b'],
        new Date('2020-01-01T00:00:00.000Z'),
        new Date('2020-01-02T00:00:00.000Z')
      );
      expect(axios.get).toHaveBeenCalledTimes(2);
      expect(total).toBe(6);
    });
  });

  describe('getTimeOfDayPeriodBasedOnTime', () => {
    const baseDateTimeString = '2025-02-21T21:41:14.677Z';

    test('calculate proper time of day range based on time', () => {
      expect(
        // time being converted to 15:41 based on Monterrey time, having 941 minutes therefore falling into period #1
        getTimeOfDayPeriodBasedOnTime(
          baseDateTimeString,
          'America/Monterrey'
        )
      ).toBe(TIME_OF_DAY_PERIODS[1]);
    });

    test('calculate proper time of day range based on time', () => {
      expect(
        // time being converted to 05:41 based on Hong Kong time, having 341 minutes therefore falling into period #1
        getTimeOfDayPeriodBasedOnTime(
          baseDateTimeString,
          'Asia/Hong_Kong'
        )
      ).toBe(TIME_OF_DAY_PERIODS[5]);
    });
  });

  describe('buildFeatureCollectionOfTwoPointLineStringSegments', () => {

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

    test('builds feature collection of two-point line string segments', () => {

      const resultFeatures = [
        {
          properties: {
            startColor: TIME_OF_DAY_PERIODS[1].color,
            endColor: TIME_OF_DAY_PERIODS[4].color,
            startTime: '2025-02-27T21:42:01+00:00',
            endTime: '2025-02-24T06:06:05+00:00'
          },
          geometry: {
            coordinates: [
              [-109.41014560634443, -27.166035291320892],
              [-109.41937192180515, -27.161194427154097]
            ]
          }
        },
        {
          properties: {
            startColor: TIME_OF_DAY_PERIODS[4].color,
            endColor: TIME_OF_DAY_PERIODS[3].color,
            startTime: '2025-02-24T06:06:05+00:00',
            endTime: '2025-02-24T03:58:02+00:00'
          },
          geometry: {
            coordinates: [
              [-109.41937192180515, -27.161194427154097],
              [-109.42032127709739, -27.17047350291985]
            ]
          }
        },
        {
          properties: {
            startColor: TIME_OF_DAY_PERIODS[3].color,
            endColor: TIME_OF_DAY_PERIODS[2].color,
            startTime: '2025-02-24T03:58:02+00:00',
            endTime: '2025-02-17T00:16:01+00:00'
          },
          geometry: {
            coordinates: [
              [-109.42032127709739, -27.17047350291985],
              [-109.37653132599918, -27.08924213333757]
            ]
          }
        },
        {
          properties: {
            startColor: TIME_OF_DAY_PERIODS[2].color,
            endColor: TIME_OF_DAY_PERIODS[6].color,
            startTime: '2025-02-17T00:16:01+00:00',
            endTime: '2025-02-14T12:24:01+00:00'
          },
          geometry: {
            coordinates: [
              [-109.37653132599918, -27.08924213333757],
              [-109.38397002503892, -27.114204665851712]
            ]
          }
        }
      ];

      const trackSegments = buildTrackSegments(track, 'America/Monterrey');

      expect(trackSegments.features.length).toBe(resultFeatures.length);
      expect(trackSegments.type).toBe('FeatureCollection');

      trackSegments.features.forEach((feature, index) => {
        const expectedFeature = resultFeatures[index];

        expect(feature.type).toBe('Feature');

        // expected properties
        expect(feature.properties.startColor).toBe(expectedFeature.properties.startColor);
        expect(feature.properties.endColor).toBe(expectedFeature.properties.endColor);
        expect(feature.properties.startTime).toBe(expectedFeature.properties.startTime);
        expect(feature.properties.endTime).toBe(expectedFeature.properties.endTime);

        // expected geometry
        expect(feature.geometry.type).toBe('LineString');
        expect(feature.geometry.coordinates).toStrictEqual(expectedFeature.geometry.coordinates);
      });

    });

    test('returns empty feature collection when track data has no features', () => {
      const emptyTracks = { ...track };
      emptyTracks.features = [];

      const emptyFeatureCollection = buildTrackSegments(emptyTracks, 'America/Monterrey');

      expect(emptyFeatureCollection.features.length).toBe(0);
      expect(emptyFeatureCollection.type).toBe('FeatureCollection');
    });

    test('returns empty feature collection when track data has no valid features', () => {
      const invalidFeaturesTrack = { ...track };
      invalidFeaturesTrack.features = [{}];

      const emptyFeatureCollection = buildTrackSegments(invalidFeaturesTrack, 'America/Monterrey');

      expect(emptyFeatureCollection.features.length).toBe(0);
      expect(emptyFeatureCollection.type).toBe('FeatureCollection');
    });

    test('returns empty feature collection when track feature has no enough data', () => {
      const feature = { ...track.features[0] };
      feature.geometry.coordinates = [];

      const notEnoughFeaturesTracks = { ...track };
      notEnoughFeaturesTracks.features = [feature];

      const emptyFeatureCollection = buildTrackSegments(notEnoughFeaturesTracks, 'America/Monterrey');

      expect(emptyFeatureCollection.features.length).toBe(0);
      expect(emptyFeatureCollection.type).toBe('FeatureCollection');
    });


  });

  describe('fixAntimeridianCrossing', () => {

    test('returns original collection when input is null or undefined', () => {
      expect(fixAntimeridianCrossing(null)).toBe(null);
      expect(fixAntimeridianCrossing(undefined)).toBe(undefined);
    });

    test('returns original collection when features array is empty', () => {
      const emptyCollection = { type: 'FeatureCollection', features: [] };
      expect(fixAntimeridianCrossing(emptyCollection)).toBe(emptyCollection);
    });

    test('handles LineString geometry with antimeridian crossing', () => {
      const trackFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [170, 10],
                [-170, 15], // This should be adjusted to 190
                [175, 20]
              ]
            },
            properties: {}
          }
        ]
      };

      const result = fixAntimeridianCrossing(trackFeatureCollection);

      expect(result.features[0].geometry.coordinates).toEqual([
        [170, 10],
        [190, 15], // 360 - 170 = 190
        [175, 20]
      ]);
    });

    test('handles LineString geometry with negative antimeridian crossing', () => {
      const trackFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [-170, 10],
                [170, 15], // This should be adjusted to -190
                [-175, 20]
              ]
            },
            properties: {}
          }
        ]
      };

      const result = fixAntimeridianCrossing(trackFeatureCollection);

      expect(result.features[0].geometry.coordinates).toEqual([
        [-170, 10],
        [-190, 15], // 170 - 360 = -190
        [-175, 20]
      ]);
    });

    test('handles Polygon geometry with antimeridian crossing', () => {
      const trackFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [170, 10],
                  [-170, 15], // This should be adjusted to 190
                  [175, 20],
                  [170, 10] // Close the ring
                ]
              ]
            },
            properties: {}
          }
        ]
      };

      const result = fixAntimeridianCrossing(trackFeatureCollection);

      expect(result.features[0].geometry.coordinates[0]).toEqual([
        [170, 10],
        [190, 15],
        [175, 20],
        [170, 10]
      ]);
    });

    test('handles MultiLineString geometry with antimeridian crossing', () => {
      const trackFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'MultiLineString',
              coordinates: [
                [
                  [170, 10],
                  [-170, 15], // This should be adjusted to 190
                  [175, 20]
                ],
                [
                  [-170, 30],
                  [170, 35], // This should be adjusted to -190
                  [-175, 40]
                ]
              ]
            },
            properties: {}
          }
        ]
      };

      const result = fixAntimeridianCrossing(trackFeatureCollection);

      expect(result.features[0].geometry.coordinates[0]).toEqual([
        [170, 10],
        [190, 15],
        [175, 20]
      ]);
      expect(result.features[0].geometry.coordinates[1]).toEqual([
        [-170, 30],
        [-190, 35],
        [-175, 40]
      ]);
    });

    test('handles MultiPolygon geometry with antimeridian crossing', () => {
      const trackFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'MultiPolygon',
              coordinates: [
                [
                  [
                    [170, 10],
                    [-170, 15], // This should be adjusted to 190
                    [175, 20],
                    [170, 10]
                  ]
                ]
              ]
            },
            properties: {}
          }
        ]
      };

      const result = fixAntimeridianCrossing(trackFeatureCollection);

      expect(result.features[0].geometry.coordinates[0][0]).toEqual([
        [170, 10],
        [190, 15],
        [175, 20],
        [170, 10]
      ]);
    });

    test('leaves Point geometry unchanged', () => {
      const trackFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [170, 10]
            },
            properties: {}
          }
        ]
      };

      const result = fixAntimeridianCrossing(trackFeatureCollection);

      expect(result.features[0].geometry.coordinates).toEqual([170, 10]);
    });

    test('leaves MultiPoint geometry unchanged', () => {
      const trackFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'MultiPoint',
              coordinates: [[170, 10], [-170, 15]]
            },
            properties: {}
          }
        ]
      };

      const result = fixAntimeridianCrossing(trackFeatureCollection);

      expect(result.features[0].geometry.coordinates).toEqual([[170, 10], [-170, 15]]);
    });

    test('handles multiple features with different geometry types', () => {
      const trackFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [170, 10],
                [-170, 15] // This should be adjusted to 190
              ]
            },
            properties: {}
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [170, 10]
            },
            properties: {}
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-170, 30],
                  [170, 35], // This should be adjusted to -190
                  [-175, 40],
                  [-170, 30]
                ]
              ]
            },
            properties: {}
          }
        ]
      };

      const result = fixAntimeridianCrossing(trackFeatureCollection);

      // LineString should be fixed
      expect(result.features[0].geometry.coordinates).toEqual([
        [170, 10],
        [190, 15]
      ]);

      // Point should be unchanged
      expect(result.features[1].geometry.coordinates).toEqual([170, 10]);

      // Polygon should be fixed
      expect(result.features[2].geometry.coordinates[0]).toEqual([
        [-170, 30],
        [-190, 35],
        [-175, 40],
        [-170, 30]
      ]);
    });

    test('handles features with no geometry', () => {
      const trackFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: null,
            properties: {}
          },
          {
            type: 'Feature',
            properties: {}
          }
        ]
      };

      const result = fixAntimeridianCrossing(trackFeatureCollection);

      expect(result.features[0].geometry).toBe(null);
      expect(result.features[1].geometry).toBeUndefined();
    });

    test('handles unknown geometry types by returning them unchanged', () => {
      const trackFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'UnknownGeometry',
              coordinates: [[170, 10], [-170, 15]]
            },
            properties: {}
          }
        ]
      };

      const result = fixAntimeridianCrossing(trackFeatureCollection);

      expect(result.features[0].geometry.coordinates).toEqual([[170, 10], [-170, 15]]);
    });

    test('handles coordinates that do not cross antimeridian', () => {
      const trackFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [10, 10],
                [20, 15],
                [30, 20]
              ]
            },
            properties: {}
          }
        ]
      };

      const result = fixAntimeridianCrossing(trackFeatureCollection);

      expect(result.features[0].geometry.coordinates).toEqual([
        [10, 10],
        [20, 15],
        [30, 20]
      ]);
    });

    test('handles large rectangle crossing antimeridian correctly', () => {
      const trackFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [170, 60],   // Top-left (western edge)
                [-170, 60],  // Top-right (eastern edge) - crosses antimeridian
                [-170, -60], // Bottom-right
                [170, -60],  // Bottom-left
                [170, 60]    // Close the ring
              ]]
            },
            properties: {}
          }
        ]
      };

      const result = fixAntimeridianCrossing(trackFeatureCollection);

      // For a large rectangle crossing the antimeridian, we expect:
      // - First coordinate stays the same: [170, 60]
      // - Second coordinate should be adjusted to [190, 60] (not -170)
      // - Third coordinate should be adjusted to [190, -60] (not -170)
      // - Fourth coordinate should be adjusted to [170, -60] (stays the same)
      // - Fifth coordinate should be adjusted to [170, 60] (stays the same)
      expect(result.features[0].geometry.coordinates[0]).toEqual([
        [170, 60],
        [190, 60],   // -170 + 360 = 190
        [190, -60],  // -170 + 360 = 190
        [170, -60],
        [170, 60]
      ]);
    });

  });

  describe('findClosestPositionDescending', () => {
    const pointsDesc = [
      { t: '2024-03-15T10:00:00.000Z', lon: 10, lat: 10 },
      { t: '2024-03-15T09:00:00.000Z', lon: 9, lat: 9 },
      { t: '2024-03-15T08:00:00.000Z', lon: 8, lat: 8 },
    ];

    test('returns null for empty or missing points or virtualDate', () => {
      expect(findClosestPositionDescending([], '2024-03-15T09:30:00.000Z')).toBeNull();
      expect(findClosestPositionDescending(null, '2024-03-15T09:30:00.000Z')).toBeNull();
      expect(findClosestPositionDescending(pointsDesc, null)).toBeNull();
    });

    test('returns null when all points are after virtualDate', () => {
      expect(findClosestPositionDescending(pointsDesc, '2024-03-15T07:00:00.000Z')).toBeNull();
    });

    test('returns newest point when virtualDate is after all points', () => {
      const result = findClosestPositionDescending(pointsDesc, '2024-03-15T11:00:00.000Z');
      expect(result).toEqual({ t: '2024-03-15T10:00:00.000Z', lon: 10, lat: 10 });
    });

    test('returns closest point at or before virtualDate (descending order)', () => {
      const result = findClosestPositionDescending(pointsDesc, '2024-03-15T09:30:00.000Z');
      expect(result).toEqual({ t: '2024-03-15T09:00:00.000Z', lon: 9, lat: 9 });
    });

    test('returns exact match when virtualDate equals a point time', () => {
      const result = findClosestPositionDescending(pointsDesc, '2024-03-15T09:00:00.000Z');
      expect(result).toEqual({ t: '2024-03-15T09:00:00.000Z', lon: 9, lat: 9 });
    });

    test('accepts Date object for virtualDate', () => {
      const result = findClosestPositionDescending(pointsDesc, new Date('2024-03-15T09:30:00.000Z'));
      expect(result).toEqual({ t: '2024-03-15T09:00:00.000Z', lon: 9, lat: 9 });
    });
  });

  describe('getVtRangeParam', () => {
    test.each([
      [1,   '30'],
      [30,  '30'],
      [31,  '45'],
      [45,  '45'],
      [46,  '60'],
      [60,  '60'],
      [61,  '90'],
      [90,  '90'],
      [91,  '150'],
      [150, '150'],
      [151, '210'],
      [210, '210'],
      [211, '365'],
      [365, '365'],
      [366, '500'],
      [500, '500'],
      [501, 'all'],
      [999, 'all'],
    ])('%i days → returns %s', (days, expected) => {
      expect(getVtRangeParam(days)).toBe(expected);
    });
  });

});