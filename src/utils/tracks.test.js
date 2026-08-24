import axios from 'axios';

import { TRACK_LENGTH_ORIGINS, TRACKS_API_URL } from '../ducks/tracks';
import store from '../store';
import { TIME_OF_DAY_PERIODS } from '../constants';

import {
  buildTrackSegments,
  fetchTracksIfNecessary,
  fixAntimeridianCrossing,
  getTimeOfDayPeriodBasedOnTime,
  trackLengthWithinTimeRange,
} from './tracks';

jest.mock('../store', () => ({
  __esModule: true,
  default: { dispatch: jest.fn(), getState: jest.fn() },
}));

describe('utils - tracks', () => {
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
            endColor: TIME_OF_DAY_PERIODS[7].color,
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

  describe('trackLengthWithinTimeRange', () => {
    // A degree of longitude at the equator.
    const ONE_DEGREE_IN_KILOMETERS = 111.19;

    // Tracks are stored most recent position first.
    const trackData = {
      track: {
        features: [{
          geometry: { coordinates: [[3, 0], [2, 0], [1, 0], [0, 0]], type: 'LineString' },
          properties: {
            coordinateProperties: {
              times: [
                '2026-04-13T04:00:00.000Z',
                '2026-04-13T03:00:00.000Z',
                '2026-04-13T02:00:00.000Z',
                '2026-04-13T01:00:00.000Z',
              ],
            },
          },
          type: 'Feature',
        }],
        type: 'FeatureCollection',
      },
    };

    test('measures only the positions within the time range', () => {
      expect(trackLengthWithinTimeRange(trackData, '2026-04-13T02:00:00.000Z', '2026-04-13T03:00:00.000Z'))
        .toBeCloseTo(ONE_DEGREE_IN_KILOMETERS, 1);
    });

    test('measures up to the most recent position when there is no end of the range', () => {
      expect(trackLengthWithinTimeRange(trackData, '2026-04-13T02:00:00.000Z'))
        .toBeCloseTo(2 * ONE_DEGREE_IN_KILOMETERS, 1);
    });

    test('measures the whole track when there is no time range', () => {
      expect(trackLengthWithinTimeRange(trackData)).toBeCloseTo(3 * ONE_DEGREE_IN_KILOMETERS, 1);
    });

    test('leaves the track untouched', () => {
      const originalTrackData = JSON.parse(JSON.stringify(trackData));

      trackLengthWithinTimeRange(trackData, '2026-04-13T02:00:00.000Z', '2026-04-13T03:00:00.000Z');

      expect(trackData).toEqual(originalTrackData);
    });

    test('measures no length for a time range holding a single position', () => {
      expect(trackLengthWithinTimeRange(trackData, '2026-04-13T02:00:00.000Z', '2026-04-13T02:00:00.000Z')).toBe(0);
    });

    test('measures no length for a track without geometry', () => {
      const trackWithoutGeometry = { track: { features: [{ properties: {}, type: 'Feature' }] } };

      expect(trackLengthWithinTimeRange(trackWithoutGeometry)).toBe(0);
      expect(trackLengthWithinTimeRange(trackWithoutGeometry, '2026-04-13T02:00:00.000Z')).toBe(0);
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


  describe('fetchTracksIfNecessary', () => {
    const EVENT_FILTER_LOWER = '2026-08-01T00:00:00.000Z';

    // Resolves once every pending microtask and timer callback has run.
    const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

    let pendingRequestResolvers;

    // Dispatched requests stay pending until released.
    const releaseOneRequest = async () => {
      pendingRequestResolvers.shift()?.();

      await settle();
    };

    const releaseAllRequests = async () => {
      while (pendingRequestResolvers.length) {
        await releaseOneRequest();
      }
    };

    beforeEach(() => {
      pendingRequestResolvers = [];

      store.dispatch.mockImplementation(
        () => new Promise((resolve) => pendingRequestResolvers.push(resolve))
      );
      store.getState.mockReturnValue({
        data: {
          eventFilter: { filter: { date_range: { lower: EVENT_FILTER_LOWER, upper: null } } },
          tracks: {},
        },
        view: {
          timeSliderState: { active: true },
          trackSettings: { length: 21, origin: TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH },
        },
      });
    });

    afterEach(async () => {
      // Settles outstanding requests so no pending work leaks into the next test.
      await releaseAllRequests();

      jest.restoreAllMocks();
      jest.clearAllMocks();
    });

    test('leaves the upper bound open while the time slider is active', async () => {
      jest.spyOn(axios, 'get').mockResolvedValue({ data: { data: { features: [] } } });
      // Runs the real fetchTracks thunk so the request window itself can be asserted.
      store.dispatch.mockImplementation((thunk) => thunk(jest.fn()));

      await fetchTracksIfNecessary(['subject-1']);

      expect(axios.get).toHaveBeenCalledWith(
        TRACKS_API_URL('subject-1'),
        expect.objectContaining({ params: { since: EVENT_FILTER_LOWER } }),
      );
    });

    test('keeps deduplicating an id whose earlier request was superseded and cancelled', async () => {
      const trackedId = 'subject-1';

      fetchTracksIfNecessary([trackedId]);

      // A wider window supersedes the first request, cancelling it.
      store.getState.mockReturnValue({
        data: {
          eventFilter: { filter: { date_range: { lower: '2026-07-01T00:00:00.000Z', upper: null } } },
          tracks: {},
        },
        view: {
          timeSliderState: { active: true },
          trackSettings: { length: 21, origin: TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH },
        },
      });
      fetchTracksIfNecessary([trackedId]);

      await settle();
      // Settling the superseded request must not clear the replacement's entry.
      await releaseOneRequest();

      fetchTracksIfNecessary([trackedId]);

      await settle();

      expect(store.dispatch).toHaveBeenCalledTimes(2);
    });

    test('does not start a second request for an id that is already in flight', async () => {
      fetchTracksIfNecessary(['subject-1', 'subject-2']);
      fetchTracksIfNecessary(['subject-1', 'subject-2']);

      await settle();

      expect(store.dispatch).toHaveBeenCalledTimes(2);
    });
  });
});
