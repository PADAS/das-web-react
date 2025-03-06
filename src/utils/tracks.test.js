import { buildTrackSegments, getTimeOfDayPeriodBasedOnTime } from './tracks';

import { TIME_OF_DAY_PERIODS } from '../constants';

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






});