import omit from 'lodash/omit';

import { TRACK_LENGTH_ORIGINS } from '../../ducks/tracks';

import {
  selectIsPatrolTrackShown,
  selectPatrolLeadersWithLastPosition,
  selectPatrolLeadSumDistance,
  selectPatrolMapTrackData,
  selectPatrolMeasuredSubjectIds,
  selectPatrolRosterFallbackSubjects,
  selectPatrolSegmentsTrackData,
  selectPatrolSegmentTrackedSubjects,
  selectPatrolsWithTracks,
  selectPatrolsWithTracksData,
  selectPatrolsWithTracksTrackedSubjectRequests,
  selectPatrolTrackData,
  selectPatrolTrackedSubjects,
  selectSubjectTracksWithPatrolTrackShownFlag,
  selectTrackedSubjectsPerPatrolSegment,
} from './';

jest.mock('../../store', () => ({}));

describe('Selectors - Patrols', () => {
  let state;
  beforeEach(() => {
    state = {
      data: {
        eventFilter: {
          filter: {
            date_range: {
              lower: '2020-01-01T06:00:00.000Z',
            },
          },
        },
        patrolTeamAndTrackingOptions: { assets: [], leaders: [], members: [], teams: [] },
        patrolStore: {},
        subjectStore: {},
        tracks: {},
      },
      view: {
        patrolTrackState: {
          hiddenSubjects: {},
          pinned: [],
          visible: [],
        },
        subjectTrackState: {
          pinned: [],
          visible: [],
        },
        timeSliderState: {
          active: false,
          virtualDate: null,
        },
        trackSettings: {
          isTimeOfDayColoringActive: false,
          length: 21,
          origin: TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH,
          timeOfDayTimeZone: null,
        },
      },
    };
  });

  describe('selectPatrolTrackData', () => {
    beforeAll(() => {
      jest.useFakeTimers().setSystemTime(new Date('2020-01-10'));
    });

    test('builds the patrol data for the patrol specified', () => {
      state.data.tracks = {
        subject123: {
          fetchedDateRange: {
            since: '2020-01-01T00:00:00.000Z',
          },
          points: {
            features: [],
          },
          track: {
            features: [
              {
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [0, 0],
                    [0, 1],
                    [0, 2],
                    [0, 3],
                    [0, 4],
                  ],
                },
                properties: {
                  coordinateProperties: {
                    times: [
                      '2020-01-01T00:00:00.000Z',
                      '2020-01-03T00:00:00.000Z',
                      '2020-01-05T00:00:00.000Z',
                      '2020-01-07T00:00:00.000Z',
                      '2020-01-09T00:00:00.000Z',
                    ],
                  },
                },
              },
            ],
          },
        },
      };
      const patrol = {
        patrol_segments: [
          {
            leader: {
              id: 'subject123',
            },
            time_range: {
              end_time: '2020-01-15T00:00:00.000Z',
              start_time: '2020-01-01T00:00:00.000Z',
            },
          },
        ],
      };
      const trimmedTrackData = {
        points: { type: 'FeatureCollection', features: [] },
        track: {
          type: 'FeatureCollection',
          features: [
            {
              geometry: {
                type: 'LineString',
                coordinates: [
                  [0, 0],
                  [0, 1],
                  [0, 2],
                  [0, 3],
                  [0, 4],
                ],
              },
              properties: {
                coordinateProperties: {
                  times: [
                    '2020-01-01T00:00:00.000Z',
                    '2020-01-03T00:00:00.000Z',
                    '2020-01-05T00:00:00.000Z',
                    '2020-01-07T00:00:00.000Z',
                    '2020-01-09T00:00:00.000Z',
                  ],
                },
              },
            },
          ],
        },
      };

      expect(selectPatrolTrackData(state, patrol)).toEqual({
        hasTrackData: true,
        leader: { id: 'subject123' },
        startStopGeometries: null,
        subjectsTrackData: [{
          distance: expect.any(Number),
          isHidden: false,
          subject: { id: 'subject123' },
          trackData: trimmedTrackData,
        }],
        trackData: trimmedTrackData,
      });
    });

    test('resolves the patrol leader from the last leg', () => {
      const patrol = {
        state: 'done',
        patrol_segments: [
          {
            leader: { id: 'subject111' },
            time_range: {
              end_time: '2020-01-03T00:00:00.000Z',
              start_time: '2020-01-01T00:00:00.000Z',
            },
          },
          {
            leader: { id: 'subject222' },
            time_range: {
              end_time: '2020-01-07T00:00:00.000Z',
              start_time: '2020-01-05T00:00:00.000Z',
            },
          },
        ],
      };

      expect(selectPatrolTrackData(state, patrol)).toEqual({
        hasTrackData: false,
        leader: { id: 'subject222' },
        startStopGeometries: null,
        subjectsTrackData: [
          { distance: null, isHidden: false, subject: { id: 'subject111' }, trackData: null },
          { distance: null, isHidden: false, subject: { id: 'subject222' }, trackData: null },
        ],
        trackData: null,
      });
    });

    test('excludes a leg from the combined track when its time range has no start time', () => {
      state.data.tracks = {
        subjectA: {
          fetchedDateRange: { since: '2019-11-01T00:00:00.000Z' },
          points: { features: [] },
          track: {
            features: [
              {
                geometry: { type: 'LineString', coordinates: [[9, 9], [9, 10]] },
                properties: {
                  coordinateProperties: {
                    times: ['2019-11-01T00:00:00.000Z', '2019-11-02T00:00:00.000Z'],
                  },
                },
              },
            ],
          },
        },
        subjectB: {
          fetchedDateRange: { since: '2020-01-01T00:00:00.000Z' },
          points: { features: [] },
          track: {
            features: [
              {
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [0, 0],
                    [0, 1],
                    [0, 2],
                    [0, 3],
                    [0, 4],
                  ],
                },
                properties: {
                  coordinateProperties: {
                    times: [
                      '2020-01-01T00:00:00.000Z',
                      '2020-01-03T00:00:00.000Z',
                      '2020-01-05T00:00:00.000Z',
                      '2020-01-07T00:00:00.000Z',
                      '2020-01-09T00:00:00.000Z',
                    ],
                  },
                },
              },
            ],
          },
        },
      };
      const patrol = {
        state: 'done',
        patrol_segments: [
          {
            leader: { id: 'subjectA' },
            time_range: {
              end_time: '2019-11-02T00:00:00.000Z',
            },
          },
          {
            leader: { id: 'subjectB' },
            time_range: {
              end_time: '2020-01-15T00:00:00.000Z',
              start_time: '2020-01-01T00:00:00.000Z',
            },
          },
        ],
      };

      const trimmedTrackData = {
        points: { type: 'FeatureCollection', features: [] },
        track: {
          type: 'FeatureCollection',
          features: [
            {
              geometry: {
                type: 'LineString',
                coordinates: [
                  [0, 0],
                  [0, 1],
                  [0, 2],
                  [0, 3],
                  [0, 4],
                ],
              },
              properties: {
                coordinateProperties: {
                  times: [
                    '2020-01-01T00:00:00.000Z',
                    '2020-01-03T00:00:00.000Z',
                    '2020-01-05T00:00:00.000Z',
                    '2020-01-07T00:00:00.000Z',
                    '2020-01-09T00:00:00.000Z',
                  ],
                },
              },
            },
          ],
        },
      };

      expect(selectPatrolTrackData(state, patrol)).toEqual({
        hasTrackData: true,
        leader: { id: 'subjectB' },
        startStopGeometries: null,
        subjectsTrackData: [
          { distance: null, isHidden: false, subject: { id: 'subjectA' }, trackData: null },
          {
            distance: expect.any(Number),
            isHidden: false,
            subject: { id: 'subjectB' },
            trackData: trimmedTrackData,
          },
        ],
        trackData: trimmedTrackData,
      });
    });

    test('combines the track of every subject its legs track into the overall track', () => {
      state.data.tracks = {
        subjectEarly: {
          fetchedDateRange: { since: '2020-01-01T00:00:00.000Z' },
          points: { features: [] },
          track: {
            features: [
              {
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [0, 0],
                    [0, 1],
                    [0, 2],
                    [0, 3],
                    [0, 4],
                  ],
                },
                properties: {
                  coordinateProperties: {
                    times: [
                      '2020-01-01T00:00:00.000Z',
                      '2020-01-03T00:00:00.000Z',
                      '2020-01-05T00:00:00.000Z',
                      '2020-01-07T00:00:00.000Z',
                      '2020-01-09T00:00:00.000Z',
                    ],
                  },
                },
              },
            ],
          },
        },
        subjectLate: {
          fetchedDateRange: { since: '2020-02-01T00:00:00.000Z' },
          points: { features: [] },
          track: {
            features: [
              {
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [1, 0],
                    [1, 1],
                    [1, 2],
                    [1, 3],
                    [1, 4],
                  ],
                },
                properties: {
                  coordinateProperties: {
                    times: [
                      '2020-02-01T00:00:00.000Z',
                      '2020-02-03T00:00:00.000Z',
                      '2020-02-05T00:00:00.000Z',
                      '2020-02-07T00:00:00.000Z',
                      '2020-02-09T00:00:00.000Z',
                    ],
                  },
                },
              },
            ],
          },
        },
      };
      const patrol = {
        state: 'done',
        patrol_segments: [
          {
            leader: { id: 'subjectEarly' },
            time_range: {
              end_time: '2020-01-15T00:00:00.000Z',
              start_time: '2020-01-01T00:00:00.000Z',
            },
          },
          {
            leader: { id: 'subjectLate' },
            time_range: {
              end_time: '2020-02-15T00:00:00.000Z',
              start_time: '2020-02-01T00:00:00.000Z',
            },
          },
        ],
      };

      const { subjectsTrackData, trackData } = selectPatrolTrackData(state, patrol);

      expect(subjectsTrackData.map(({ subject }) => subject.id)).toEqual(['subjectEarly', 'subjectLate']);
      expect(subjectsTrackData.map(({ trackData: subjectTrackData }) =>
        subjectTrackData.track.features[0].geometry.coordinates)).toEqual([
        [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
        [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]],
      ]);
      expect(trackData.track.features.map(({ geometry }) => geometry.coordinates)).toEqual([
        [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
        [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]],
      ]);
    });

    test('derives the overall start and end location from the first and last legs that have one', () => {
      state.data.tracks = {
        subject111: {
          fetchedDateRange: { since: '2019-11-01T00:00:00.000Z' },
          points: { features: [] },
          track: {
            features: [
              {
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [0, 0],
                    [0, 1],
                    [0, 2],
                    [0, 3],
                    [0, 4],
                  ],
                },
                properties: {
                  coordinateProperties: {
                    times: [
                      '2019-11-01T00:00:00.000Z',
                      '2019-11-03T00:00:00.000Z',
                      '2019-11-05T00:00:00.000Z',
                      '2019-11-07T00:00:00.000Z',
                      '2019-11-09T00:00:00.000Z',
                    ],
                  },
                },
              },
            ],
          },
        },
        subject222: {
          fetchedDateRange: { since: '2019-12-01T00:00:00.000Z' },
          points: { features: [] },
          track: {
            features: [
              {
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [1, 0],
                    [1, 1],
                    [1, 2],
                    [1, 3],
                    [1, 4],
                  ],
                },
                properties: {
                  coordinateProperties: {
                    times: [
                      '2019-12-01T00:00:00.000Z',
                      '2019-12-03T00:00:00.000Z',
                      '2019-12-05T00:00:00.000Z',
                      '2019-12-07T00:00:00.000Z',
                      '2019-12-09T00:00:00.000Z',
                    ],
                  },
                },
              },
            ],
          },
        },
      };
      const patrol = {
        state: 'done',
        patrol_segments: [
          {
            end_location: { latitude: 1.1, longitude: 1.1 },
            leader: { id: 'subject111' },
            start_location: { latitude: 1, longitude: 1 },
            time_range: {
              end_time: '2019-11-15T00:00:00.000Z',
              start_time: '2019-11-01T00:00:00.000Z',
            },
          },
          {
            end_location: { latitude: 2.2, longitude: 2.2 },
            leader: { id: 'subject222' },
            start_location: { latitude: 2, longitude: 2 },
            time_range: {
              end_time: '2019-12-15T00:00:00.000Z',
              start_time: '2019-12-01T00:00:00.000Z',
            },
          },
        ],
      };

      const { startStopGeometries } = selectPatrolTrackData(state, patrol);

      expect(startStopGeometries.points.features.map(({ geometry }) => geometry.coordinates))
        .toEqual([[1, 1], [2, 2], [2.2, 2.2]]);
    });

    test('leaves a patrol whose last leg is still running without an end location', () => {
      state.data.tracks = {
        subject111: {
          fetchedDateRange: { since: '2020-01-01T00:00:00.000Z' },
          points: {
            features: [
              { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 2] }, properties: { time: '2020-01-08T00:00:00.000Z' } },
              { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 1] }, properties: { time: '2020-01-05T00:00:00.000Z' } },
              { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { time: '2020-01-01T00:00:00.000Z' } },
            ],
          },
          track: {
            features: [{
              geometry: { type: 'LineString', coordinates: [[0, 2], [0, 1], [0, 0]] },
              properties: {
                coordinateProperties: {
                  times: ['2020-01-08T00:00:00.000Z', '2020-01-05T00:00:00.000Z', '2020-01-01T00:00:00.000Z'],
                },
              },
            }],
          },
        },
      };
      const patrol = {
        state: 'open',
        patrol_segments: [
          {
            end_location: { latitude: 1.1, longitude: 1.1 },
            leader: { id: 'subject111' },
            start_location: { latitude: 1, longitude: 1 },
            time_range: {
              end_time: '2020-01-05T00:00:00.000Z',
              start_time: '2020-01-01T00:00:00.000Z',
            },
          },
          {
            end_location: null,
            leader: { id: 'subject111' },
            start_location: { latitude: 2, longitude: 2 },
            time_range: {
              end_time: null,
              start_time: '2020-01-05T00:00:00.000Z',
            },
          },
        ],
      };

      const { startStopGeometries } = selectPatrolTrackData(state, patrol);

      expect(startStopGeometries.points.features.map(({ geometry }) => geometry.coordinates))
        .toEqual([[1, 1], [2, 2]]);
    });

    test('marks where each leg after the first takes over with its own leg number', () => {
      state.data.tracks = {
        subject111: {
          fetchedDateRange: { since: '2019-11-01T00:00:00.000Z' },
          points: { features: [] },
          track: {
            features: [{
              geometry: { type: 'LineString', coordinates: [[0, 0], [0, 1]] },
              properties: {
                coordinateProperties: { times: ['2019-11-01T00:00:00.000Z', '2019-11-09T00:00:00.000Z'] },
              },
            }],
          },
        },
        subject222: {
          fetchedDateRange: { since: '2019-12-01T00:00:00.000Z' },
          points: { features: [] },
          track: {
            features: [{
              geometry: { type: 'LineString', coordinates: [[1, 0], [1, 1]] },
              properties: {
                coordinateProperties: { times: ['2019-12-01T00:00:00.000Z', '2019-12-09T00:00:00.000Z'] },
              },
            }],
          },
        },
      };
      const patrol = {
        state: 'done',
        patrol_segments: [
          {
            end_location: { latitude: 1.1, longitude: 1.1 },
            leader: { id: 'subject111' },
            start_location: { latitude: 1, longitude: 1 },
            time_range: { end_time: '2019-11-15T00:00:00.000Z', start_time: '2019-11-01T00:00:00.000Z' },
          },
          {
            end_location: { latitude: 2.2, longitude: 2.2 },
            leader: { id: 'subject222' },
            start_location: { latitude: 2, longitude: 2 },
            time_range: { end_time: '2019-12-15T00:00:00.000Z', start_time: '2019-12-01T00:00:00.000Z' },
          },
        ],
      };

      const { startStopGeometries } = selectPatrolTrackData(state, patrol);

      expect(startStopGeometries.points.features.map(({ properties }) => properties.legNumber))
        .toEqual([undefined, 2, undefined]);
    });

    test('marks a pause with its own number, leaving the leg numbers uninterrupted', () => {
      state.data.tracks = {
        subject111: {
          fetchedDateRange: { since: '2019-11-01T00:00:00.000Z' },
          points: { features: [] },
          track: {
            features: [{
              geometry: { type: 'LineString', coordinates: [[0, 0], [0, 1], [0, 2]] },
              properties: {
                coordinateProperties: {
                  times: [
                    '2019-11-20T00:00:00.000Z',
                    '2019-11-10T00:00:00.000Z',
                    '2019-11-01T00:00:00.000Z',
                  ],
                },
              },
            }],
          },
        },
      };
      const patrol = {
        state: 'done',
        patrol_segments: [
          {
            leader: { id: 'subject111' },
            start_location: { latitude: 1, longitude: 1 },
            time_range: { end_time: '2019-11-08T00:00:00.000Z', start_time: '2019-11-01T00:00:00.000Z' },
          },
          {
            is_pause: true,
            leader: { id: 'subject111' },
            start_location: { latitude: 2, longitude: 2 },
            time_range: { end_time: '2019-11-15T00:00:00.000Z', start_time: '2019-11-08T00:00:00.000Z' },
          },
        ],
      };

      const { startStopGeometries } = selectPatrolTrackData(state, patrol);

      expect(startStopGeometries.points.features.map(({ properties }) => properties.legNumber))
        .toEqual([undefined, undefined, undefined]);
      expect(startStopGeometries.points.features.map(({ properties }) => properties.pauseNumber))
        .toEqual([undefined, 1, undefined]);
    });

    test('numbers the leg after a pause as the one that follows the leg before it', () => {
      state.data.tracks = {
        subject111: {
          fetchedDateRange: { since: '2019-11-01T00:00:00.000Z' },
          points: { features: [] },
          track: {
            features: [{
              geometry: { type: 'LineString', coordinates: [[0, 0], [0, 1], [0, 2]] },
              properties: {
                coordinateProperties: {
                  times: [
                    '2019-11-20T00:00:00.000Z',
                    '2019-11-10T00:00:00.000Z',
                    '2019-11-01T00:00:00.000Z',
                  ],
                },
              },
            }],
          },
        },
      };
      const patrol = {
        state: 'done',
        patrol_segments: [
          {
            leader: { id: 'subject111' },
            start_location: { latitude: 1, longitude: 1 },
            time_range: { end_time: '2019-11-08T00:00:00.000Z', start_time: '2019-11-01T00:00:00.000Z' },
          },
          {
            is_pause: true,
            leader: { id: 'subject111' },
            start_location: { latitude: 2, longitude: 2 },
            time_range: { end_time: '2019-11-15T00:00:00.000Z', start_time: '2019-11-08T00:00:00.000Z' },
          },
          {
            leader: { id: 'subject111' },
            start_location: { latitude: 3, longitude: 3 },
            time_range: { end_time: '2019-11-22T00:00:00.000Z', start_time: '2019-11-15T00:00:00.000Z' },
          },
        ],
      };

      const { startStopGeometries } = selectPatrolTrackData(state, patrol);

      expect(startStopGeometries.points.features.map(({ properties }) => properties.legNumber))
        .toEqual([undefined, undefined, 2, undefined]);
    });

    test('dashes a line across a pause, from where the patrol stopped to where it picked up', () => {
      state.data.tracks = {
        subject111: {
          fetchedDateRange: { since: '2019-11-01T00:00:00.000Z' },
          points: { features: [] },
          track: {
            features: [{
              geometry: { type: 'LineString', coordinates: [[0, 0], [0, 1], [0, 2]] },
              properties: {
                coordinateProperties: {
                  times: [
                    '2019-11-20T00:00:00.000Z',
                    '2019-11-10T00:00:00.000Z',
                    '2019-11-01T00:00:00.000Z',
                  ],
                },
              },
            }],
          },
        },
      };
      const patrol = {
        state: 'done',
        patrol_segments: [
          {
            leader: { id: 'subject111' },
            start_location: { latitude: 1, longitude: 1 },
            time_range: { end_time: '2019-11-08T00:00:00.000Z', start_time: '2019-11-01T00:00:00.000Z' },
          },
          {
            is_pause: true,
            leader: { id: 'subject111' },
            start_location: { latitude: 2, longitude: 2 },
            time_range: { end_time: '2019-11-15T00:00:00.000Z', start_time: '2019-11-08T00:00:00.000Z' },
          },
          {
            leader: { id: 'subject111' },
            start_location: { latitude: 3, longitude: 3 },
            time_range: { end_time: '2019-11-22T00:00:00.000Z', start_time: '2019-11-15T00:00:00.000Z' },
          },
        ],
      };

      const { startStopGeometries } = selectPatrolTrackData(state, patrol);

      expect(startStopGeometries.lines.features).toHaveLength(1);
      expect(startStopGeometries.lines.features[0].geometry.coordinates).toEqual([[[2, 2], [3, 3]]]);
    });

    test('marks a leg with no lead from the first subject it tracks', () => {
      const asset = { id: 'subjectAsset', name: 'KTN-123' };

      state.data.patrolTeamAndTrackingOptions.assets = [asset];
      state.data.tracks = {
        [asset.id]: {
          fetchedDateRange: { since: '2019-11-01T00:00:00.000Z' },
          points: {
            features: [
              { geometry: { coordinates: [0, 2] }, properties: { time: '2019-11-20T00:00:00.000Z' } },
              { geometry: { coordinates: [0, 0] }, properties: { time: '2019-11-01T00:00:00.000Z' } },
            ],
          },
          track: {
            features: [{
              geometry: { type: 'LineString', coordinates: [[0, 2], [0, 0]] },
              properties: {
                coordinateProperties: { times: ['2019-11-20T00:00:00.000Z', '2019-11-01T00:00:00.000Z'] },
              },
            }],
          },
        },
      };

      const patrol = {
        state: 'done',
        patrol_segments: [{
          assets: [asset.id],
          time_range: { end_time: '2019-11-20T00:00:00.000Z', start_time: '2019-11-01T00:00:00.000Z' },
        }],
      };

      const { startStopGeometries } = selectPatrolTrackData(state, patrol);

      expect(startStopGeometries.points.features.map(({ geometry }) => geometry.coordinates))
        .toEqual([[0, 0], [0, 2]]);
    });

    test('does not mark a leg whose window holds none of its leader positions', () => {
      state.data.tracks = {
        subject111: {
          fetchedDateRange: { since: '2019-11-01T00:00:00.000Z' },
          points: { features: [] },
          track: {
            features: [{
              geometry: { type: 'LineString', coordinates: [[0, 0], [0, 1]] },
              properties: {
                coordinateProperties: { times: ['2019-11-09T00:00:00.000Z', '2019-11-01T00:00:00.000Z'] },
              },
            }],
          },
        },
      };
      const patrol = {
        state: 'open',
        patrol_segments: [
          {
            leader: { id: 'subject111' },
            start_location: { latitude: 1, longitude: 1 },
            time_range: { end_time: '2019-11-15T00:00:00.000Z', start_time: '2019-11-01T00:00:00.000Z' },
          },
          {
            leader: { id: 'subject111' },
            start_location: { latitude: 2, longitude: 2 },
            time_range: { end_time: null, start_time: '2030-01-01T00:00:00.000Z' },
          },
        ],
      };

      const { startStopGeometries } = selectPatrolTrackData(state, patrol);

      expect(startStopGeometries.points.features.map(({ properties }) => properties.legNumber))
        .toEqual([undefined]);
    });

    describe('a subject that came and went across the legs', () => {
      const ASSET = { id: 'subjectAsset', name: 'KTN-123' };

      const assetTrack = {
        fetchedDateRange: { since: '2020-01-01T00:00:00.000Z' },
        points: { features: [] },
        track: {
          features: [{
            geometry: {
              type: 'LineString',
              coordinates: [[0, 4], [0, 3], [0, 2], [0, 1], [0, 0]],
            },
            properties: {
              coordinateProperties: {
                times: [
                  '2020-01-09T00:00:00.000Z',
                  '2020-01-07T00:00:00.000Z',
                  '2020-01-05T00:00:00.000Z',
                  '2020-01-03T00:00:00.000Z',
                  '2020-01-01T00:00:00.000Z',
                ],
              },
            },
          }],
        },
      };

      const patrolSegment = (startTime, endTime, patrolSegmentProps = {}) => ({
        time_range: { end_time: endTime, start_time: startTime },
        ...patrolSegmentProps,
      });

      beforeEach(() => {
        state.data.patrolTeamAndTrackingOptions.assets = [ASSET];
        state.data.tracks = { [ASSET.id]: assetTrack };
      });

      test('leaves a gap where it was off the patrol', () => {
        const patrol = {
          state: 'done',
          patrol_segments: [
            patrolSegment('2020-01-01T00:00:00.000Z', '2020-01-03T00:00:00.000Z', { assets: [ASSET.id] }),
            patrolSegment('2020-01-03T00:00:00.000Z', '2020-01-07T00:00:00.000Z'),
            patrolSegment('2020-01-07T00:00:00.000Z', '2020-01-09T00:00:00.000Z', { assets: [ASSET.id] }),
          ],
        };

        const [{ trackData }] = selectPatrolTrackData(state, patrol).subjectsTrackData;

        expect(trackData.track.features.map(({ geometry }) => geometry.coordinates)).toEqual([
          [[0, 4], [0, 3]],
          [[0, 1], [0, 0]],
        ]);
      });

      test('draws one unbroken line across the legs it stayed on', () => {
        const patrol = {
          state: 'done',
          patrol_segments: [
            patrolSegment('2020-01-01T00:00:00.000Z', '2020-01-03T00:00:00.000Z', { assets: [ASSET.id] }),
            patrolSegment('2020-01-03T00:00:00.000Z', '2020-01-05T00:00:00.000Z', { assets: [ASSET.id] }),
          ],
        };

        const [{ trackData }] = selectPatrolTrackData(state, patrol).subjectsTrackData;

        expect(trackData.track.features.map(({ geometry }) => geometry.coordinates)).toEqual([
          [[0, 2], [0, 1], [0, 0]],
        ]);
      });

      test('draws nothing across a pause, and picks up again on the leg after it', () => {
        const patrol = {
          state: 'done',
          patrol_segments: [
            patrolSegment('2020-01-01T00:00:00.000Z', '2020-01-03T00:00:00.000Z', { assets: [ASSET.id] }),
            patrolSegment(
              '2020-01-03T00:00:00.000Z',
              '2020-01-05T00:00:00.000Z',
              { assets: [ASSET.id], is_pause: true }
            ),
            patrolSegment('2020-01-05T00:00:00.000Z', '2020-01-09T00:00:00.000Z', { assets: [ASSET.id] }),
          ],
        };

        const [{ trackData }] = selectPatrolTrackData(state, patrol).subjectsTrackData;

        expect(trackData.track.features.map(({ geometry }) => geometry.coordinates)).toEqual([
          [[0, 4], [0, 3], [0, 2]],
          [[0, 1], [0, 0]],
        ]);
      });

      test('counts none of the ground it covered while the patrol was paused', () => {
        const patrol = {
          state: 'done',
          patrol_segments: [
            patrolSegment('2020-01-01T00:00:00.000Z', '2020-01-05T00:00:00.000Z', { assets: [ASSET.id] }),
            patrolSegment(
              '2020-01-05T00:00:00.000Z',
              '2020-01-09T00:00:00.000Z',
              { assets: [ASSET.id], is_pause: true }
            ),
          ],
        };

        const [{ distance, trackData }] = selectPatrolTrackData(state, patrol).subjectsTrackData;

        expect(trackData.track.features.map(({ geometry }) => geometry.coordinates)).toEqual([
          [[0, 2], [0, 1], [0, 0]],
        ]);
        expect(distance).toBeCloseTo(222.4, 1);
      });

      test('keeps the track of a subject the user hid in the legend', () => {
        state.view.patrolTrackState.hiddenSubjects = { patrol123: [ASSET.id] };

        const patrol = {
          id: 'patrol123',
          state: 'done',
          patrol_segments: [
            patrolSegment('2020-01-01T00:00:00.000Z', '2020-01-03T00:00:00.000Z', { assets: [ASSET.id] }),
          ],
        };

        const patrolTrackData = selectPatrolTrackData(state, patrol);

        expect(patrolTrackData.hasTrackData).toBe(true);
        expect(patrolTrackData.subjectsTrackData[0].isHidden).toBe(false);
        expect(patrolTrackData.trackData.track.features).toHaveLength(1);
      });

      test('keeps the whole of what a subject covered, whatever the track length setting draws', () => {
        state.view.trackSettings.length = 1;

        const patrol = {
          id: 'patrol123',
          state: 'done',
          patrol_segments: [
            patrolSegment('2020-01-01T00:00:00.000Z', '2020-01-03T00:00:00.000Z', { assets: [ASSET.id] }),
          ],
        };

        expect(selectPatrolTrackData(state, patrol).trackData.track.features[0].geometry.coordinates)
          .toEqual([[0, 1], [0, 0]]);
      });
    });

    test('does not compute any track or geometry data when the patrol state does not allow displaying tracks', () => {
      state.data.tracks = {
        subject123: {
          fetchedDateRange: { since: '2020-01-01T00:00:00.000Z' },
          points: { features: [] },
          track: {
            features: [
              {
                geometry: { type: 'LineString', coordinates: [[0, 0], [0, 1]] },
                properties: {
                  coordinateProperties: {
                    times: ['2020-01-01T00:00:00.000Z', '2020-01-02T00:00:00.000Z'],
                  },
                },
              },
            ],
          },
        },
      };
      const patrol = {
        patrol_segments: [
          {
            leader: { id: 'subject123' },
            time_range: {
              start_time: '2020-03-01T00:00:00.000Z',
            },
          },
        ],
      };

      expect(selectPatrolTrackData(state, patrol)).toEqual({
        hasTrackData: false,
        leader: { id: 'subject123' },
        startStopGeometries: null,
        subjectsTrackData: [],
        trackData: null,
      });
    });

    test('derives the end location from the actual track when the patrol is done but its leg has no end time', () => {
      state.data.tracks = {
        subject999: {
          fetchedDateRange: { since: '2020-01-01T00:00:00.000Z' },
          points: {
            features: [
              { type: 'Feature', geometry: { type: 'Point', coordinates: [9, 9] }, properties: { time: '2020-01-05T00:00:00.000Z' } },
              { type: 'Feature', geometry: { type: 'Point', coordinates: [1, 1] }, properties: { time: '2020-01-01T00:00:00.000Z' } },
            ],
          },
          track: {
            features: [
              {
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [1, 1],
                    [9, 9],
                  ],
                },
                properties: {
                  coordinateProperties: {
                    times: ['2020-01-01T00:00:00.000Z', '2020-01-05T00:00:00.000Z'],
                  },
                },
              },
            ],
          },
        },
      };
      const patrol = {
        state: 'done',
        patrol_segments: [
          {
            end_location: null,
            leader: { id: 'subject999' },
            start_location: { latitude: 1, longitude: 1 },
            time_range: {
              end_time: null,
              start_time: '2020-01-01T00:00:00.000Z',
            },
          },
        ],
      };

      const { startStopGeometries } = selectPatrolTrackData(state, patrol);

      expect(startStopGeometries.points.features.map(({ geometry }) => geometry.coordinates))
        .toEqual([[1, 1], [9, 9]]);
    });

    test('does not recompute the trimmed track when an unrelated subject\'s track updates', () => {
      const patrolLeaderTrack = {
        fetchedDateRange: { since: '2020-01-01T00:00:00.000Z' },
        points: { features: [] },
        track: {
          features: [{
            geometry: { type: 'LineString', coordinates: [[0, 0], [0, 1]] },
            properties: {
              coordinateProperties: {
                times: ['2020-01-01T00:00:00.000Z', '2020-01-09T00:00:00.000Z'],
              },
            },
          }],
        },
      };
      state.data.tracks = { subject123: patrolLeaderTrack };

      const patrol = {
        patrol_segments: [{
          leader: { id: 'subject123' },
          time_range: { end_time: '2020-01-15T00:00:00.000Z', start_time: '2020-01-01T00:00:00.000Z' },
        }],
      };

      const firstResult = selectPatrolTrackData(state, patrol);

      state = {
        ...state,
        data: {
          ...state.data,
          tracks: { subject123: patrolLeaderTrack, subject999: { unrelated: true } },
        },
      };

      const secondResult = selectPatrolTrackData(state, patrol);

      expect(secondResult.trackData).toBe(firstResult.trackData);
    });

    describe('legs the leader track does not answer for', () => {
      const LEAD = { id: 'subjectLead', name: 'Maya Chen' };

      const trackWithTimes = (coordinates, times, since = '2020-01-01T00:00:00.000Z') => ({
        fetchedDateRange: { since },
        points: {
          features: times.map((time, index) => ({
            geometry: { coordinates: coordinates[index], type: 'Point' },
            properties: { time },
            type: 'Feature',
          })),
          type: 'FeatureCollection',
        },
        track: {
          features: [{
            geometry: { coordinates, type: 'LineString' },
            properties: { coordinateProperties: { times } },
            type: 'Feature',
          }],
          type: 'FeatureCollection',
        },
      });

      test('marks a leg with no leader track at the locations it was planned around', () => {
        const patrol = {
          state: 'done',
          patrol_segments: [{
            end_location: { latitude: 2, longitude: 2 },
            leader: LEAD,
            start_location: { latitude: 1, longitude: 1 },
            time_range: { end_time: '2020-01-05T00:00:00.000Z', start_time: '2020-01-01T00:00:00.000Z' },
          }],
        };

        const { startStopGeometries } = selectPatrolTrackData(state, patrol);

        expect(startStopGeometries.points.features.map((feature) => feature.geometry.coordinates))
          .toEqual([[1, 1], [2, 2]]);
      });

      test('builds a patrol whose subject track came back with no positions', () => {
        state.data.tracks = {
          [LEAD.id]: {
            fetchedDateRange: { since: '2020-01-01T00:00:00.000Z' },
            points: { features: [], type: 'FeatureCollection' },
            track: { features: [], type: 'FeatureCollection' },
          },
        };
        const patrol = {
          state: 'done',
          patrol_segments: [{
            leader: LEAD,
            start_location: { latitude: 1, longitude: 1 },
            time_range: { end_time: '2020-01-05T00:00:00.000Z', start_time: '2020-01-01T00:00:00.000Z' },
          }],
        };

        expect(selectPatrolTrackData(state, patrol).trackData).toBeNull();
        expect(selectPatrolTrackedSubjects(state, patrol)[0].distance).toBe(0);
      });

      test('keeps the stretch of a leg that its fetched track reaches', () => {
        state.data.tracks = {
          [LEAD.id]: trackWithTimes(
            [[0, 2], [0, 1], [0, 0]],
            ['2020-01-05T00:00:00.000Z', '2020-01-03T00:00:00.000Z', '2020-01-02T00:00:00.000Z'],
            '2020-01-02T00:00:00.000Z'
          ),
        };
        const patrol = {
          state: 'done',
          patrol_segments: [{
            leader: LEAD,
            time_range: { end_time: '2020-01-05T00:00:00.000Z', start_time: '2020-01-01T00:00:00.000Z' },
          }],
        };

        expect(selectPatrolTrackData(state, patrol).trackData.track.features[0].geometry.coordinates)
          .toEqual([[0, 2], [0, 1], [0, 0]]);
      });

      test('bounds a leg the record left open to the moment the patrol closed', () => {
        state.data.tracks = {
          [LEAD.id]: trackWithTimes(
            [[0, 0], [2, 0], [1, 0], [0, 0]],
            [
              '2020-01-09T00:00:00.000Z',
              '2020-01-05T00:00:00.000Z',
              '2020-01-03T00:00:00.000Z',
              '2020-01-01T00:00:00.000Z',
            ]
          ),
        };
        const patrol = {
          state: 'done',
          patrol_segments: [{ leader: LEAD, time_range: { end_time: null, start_time: '2020-01-01T00:00:00.000Z' } }],
          updates: [{ time: '2020-01-05T00:00:00.000Z', type: 'update_patrol_state' }],
        };

        expect(selectPatrolTrackData(state, patrol).trackData.track.features[0].geometry.coordinates)
          .toEqual([[2, 0], [1, 0], [0, 0]]);
      });

      test('reaches the connector lines to the leads track rather than to another subject', () => {
        const ASSET = { id: 'subjectAsset', name: 'KTN-123' };
        state.data.patrolTeamAndTrackingOptions.assets = [ASSET];
        state.data.tracks = {
          [ASSET.id]: trackWithTimes(
            [[40, 0], [40, 1]],
            ['2020-01-05T00:00:00.000Z', '2020-01-01T00:00:00.000Z']
          ),
          [LEAD.id]: trackWithTimes(
            [[0, 1], [0, 0]],
            ['2020-01-05T00:00:00.000Z', '2020-01-01T00:00:00.000Z']
          ),
        };
        const patrol = {
          state: 'done',
          patrol_segments: [{
            assets: [ASSET.id],
            leader: LEAD,
            start_location: { latitude: 5, longitude: 5 },
            time_range: { end_time: '2020-01-05T00:00:00.000Z', start_time: '2020-01-01T00:00:00.000Z' },
          }],
        };

        const { startStopGeometries } = selectPatrolTrackData(state, patrol);

        expect(startStopGeometries.lines.features[0].geometry.coordinates).toEqual([[[5, 5], [0, 0]]]);
      });

      test('does not mark a patrol as ended at a moment the time slider has not reached its end by', () => {
        state.view.timeSliderState = { active: true, virtualDate: '2020-01-03T00:00:00.000Z' };
        const patrol = {
          state: 'done',
          patrol_segments: [{
            end_location: { latitude: 2, longitude: 2 },
            leader: LEAD,
            start_location: { latitude: 1, longitude: 1 },
            time_range: { end_time: '2020-01-05T00:00:00.000Z', start_time: '2020-01-01T00:00:00.000Z' },
          }],
        };

        const { startStopGeometries } = selectPatrolTrackData(state, patrol);

        expect(startStopGeometries.points.features.map((feature) => feature.properties.markerKind))
          .toEqual(['start']);
      });

      describe('a leg whose track stops before the patrol does', () => {
        const patrol = {
          state: 'done',
          patrol_segments: [{
            leader: LEAD,
            start_location: { latitude: 0, longitude: 1 },
            time_range: { end_time: '2020-01-10T00:00:00.000Z', start_time: '2020-01-01T00:00:00.000Z' },
          }],
        };

        beforeEach(() => {
          state.data.tracks = {
            [LEAD.id]: trackWithTimes(
              [[4, 0], [3, 0], [2, 0], [1, 0]],
              [
                '2020-01-04T00:00:00.000Z',
                '2020-01-03T00:00:00.000Z',
                '2020-01-02T00:00:00.000Z',
                '2020-01-01T00:00:00.000Z',
              ]
            ),
          };
        });

        const markerKindsAtVirtualDate = (virtualDate) => {
          state.view.timeSliderState = { active: true, virtualDate };

          return selectPatrolTrackData(state, patrol).startStopGeometries.points.features
            .map((feature) => feature.properties.markerKind);
        };

        test('does not end the patrol where its track stopped while the time slider is short of its end', () => {
          expect(markerKindsAtVirtualDate('2020-01-06T00:00:00.000Z')).toEqual(['start']);
        });

        test('ends the patrol where its track stopped once the time slider has passed its end', () => {
          expect(markerKindsAtVirtualDate('2020-01-11T00:00:00.000Z')).toEqual(['start', 'end']);
        });

        test('holds back a pause standing where that track stopped until the time slider reaches it', () => {
          const patrolPausedAfterItsTrackStopped = {
            state: 'done',
            patrol_segments: [
              {
                leader: LEAD,
                start_location: { latitude: 0, longitude: 1 },
                time_range: { end_time: '2020-01-08T00:00:00.000Z', start_time: '2020-01-01T00:00:00.000Z' },
              },
              {
                is_pause: true,
                leader: LEAD,
                time_range: { end_time: null, start_time: '2020-01-08T00:00:00.000Z' },
              },
            ],
            updates: [{ time: '2020-01-10T00:00:00.000Z', type: 'update_patrol_state' }],
          };
          state.view.timeSliderState = { active: true, virtualDate: '2020-01-06T00:00:00.000Z' };

          const { startStopGeometries } = selectPatrolTrackData(state, patrolPausedAfterItsTrackStopped);

          expect(startStopGeometries.points.features.map((feature) => feature.properties.markerKind))
            .toEqual(['start']);
        });
      });
    });
  });

  describe('selectPatrolMapTrackData', () => {
    const ASSET = { id: 'subjectAsset', name: 'KTN-123' };
    const LEAD = { id: 'subjectLead', name: 'Maya Chen' };

    const trackWithTimes = (coordinates, times) => ({
      fetchedDateRange: { since: '2020-01-01T00:00:00.000Z' },
      points: { features: [] },
      track: {
        features: [{
          geometry: { type: 'LineString', coordinates },
          properties: { coordinateProperties: { times } },
        }],
      },
    });

    const patrol = {
      id: 'patrol123',
      state: 'done',
      patrol_segments: [{
        assets: [ASSET.id],
        leader: LEAD,
        time_range: { end_time: '2020-01-09T00:00:00.000Z', start_time: '2020-01-01T00:00:00.000Z' },
      }],
    };

    beforeAll(() => {
      jest.useFakeTimers().setSystemTime(new Date('2020-01-10'));
    });

    beforeEach(() => {
      state.data.patrolTeamAndTrackingOptions.assets = [ASSET];
      state.data.tracks = {
        [ASSET.id]: trackWithTimes(
          [[1, 2], [1, 1], [1, 0]],
          ['2020-01-09T00:00:00.000Z', '2020-01-05T00:00:00.000Z', '2020-01-01T00:00:00.000Z']
        ),
        [LEAD.id]: trackWithTimes(
          [[0, 2], [0, 1], [0, 0]],
          ['2020-01-09T00:00:00.000Z', '2020-01-05T00:00:00.000Z', '2020-01-01T00:00:00.000Z']
        ),
      };
    });

    test('draws the track of every subject the patrol tracks', () => {
      const patrolMapTrackData = selectPatrolMapTrackData(state, patrol);

      expect(patrolMapTrackData.trackData.track.features.map(({ geometry }) => geometry.coordinates)).toEqual([
        [[0, 2], [0, 1], [0, 0]],
        [[1, 2], [1, 1], [1, 0]],
      ]);
    });

    test('leaves the track of a subject the user hid in the legend undrawn', () => {
      state.view.patrolTrackState.hiddenSubjects = { [patrol.id]: [ASSET.id] };

      const patrolMapTrackData = selectPatrolMapTrackData(state, patrol);

      expect(patrolMapTrackData.subjectsTrackData.find(({ subject }) => subject.id === ASSET.id).isHidden).toBe(true);
      expect(patrolMapTrackData.trackData.track.features.map(({ geometry }) => geometry.coordinates)).toEqual([
        [[0, 2], [0, 1], [0, 0]],
      ]);
    });

    test('leaves the connector lines where they were when the user hides a subject in the legend', () => {
      const withPoints = (trackData) => ({
        ...trackData,
        points: {
          features: trackData.track.features[0].properties.coordinateProperties.times.map((time, index) => ({
            geometry: { coordinates: trackData.track.features[0].geometry.coordinates[index], type: 'Point' },
            properties: { time },
            type: 'Feature',
          })),
          type: 'FeatureCollection',
        },
      });
      state.data.tracks = {
        [ASSET.id]: withPoints(state.data.tracks[ASSET.id]),
        [LEAD.id]: withPoints(state.data.tracks[LEAD.id]),
      };
      const patrolWithPlannedStart = {
        ...patrol,
        patrol_segments: [{ ...patrol.patrol_segments[0], start_location: { latitude: 5, longitude: 5 } }],
      };

      const linesWithEverySubjectShown = selectPatrolMapTrackData(state, patrolWithPlannedStart)
        .startStopGeometries.lines.features[0].geometry.coordinates;

      const stateWithHiddenAsset = {
        ...state,
        view: {
          ...state.view,
          patrolTrackState: { ...state.view.patrolTrackState, hiddenSubjects: { [patrol.id]: [ASSET.id] } },
        },
      };

      expect(selectPatrolMapTrackData(stateWithHiddenAsset, patrolWithPlannedStart).startStopGeometries
        .lines.features[0].geometry.coordinates).toEqual(linesWithEverySubjectShown);
    });

    test('draws only the stretch the track length setting reaches back to', () => {
      state.view.trackSettings.length = 6;

      const patrolMapTrackData = selectPatrolMapTrackData(state, patrol);

      expect(patrolMapTrackData.trackData.track.features.map(({ geometry }) => geometry.coordinates)).toEqual([
        [[0, 2], [0, 1]],
        [[1, 2], [1, 1]],
      ]);
    });

    test('marks the patrol even once its track has scrolled out of the track length window', () => {
      state.view.trackSettings.length = 1;

      const patrolMapTrackData = selectPatrolMapTrackData(state, {
        ...patrol,
        patrol_segments: [{
          ...patrol.patrol_segments[0],
          end_location: { latitude: 1.1, longitude: 1.1 },
          start_location: { latitude: 1, longitude: 1 },
          time_range: { end_time: '2020-01-05T00:00:00.000Z', start_time: '2020-01-01T00:00:00.000Z' },
        }],
      });

      expect(patrolMapTrackData.trackData).toBeNull();
      expect(patrolMapTrackData.startStopGeometries.points.features).not.toHaveLength(0);
    });

    test('keeps the tracks the patrol covered when the time slider moves', () => {
      const patrolTrackData = selectPatrolTrackData(state, patrol);

      state = {
        ...state,
        view: { ...state.view, timeSliderState: { active: true, virtualDate: '2020-01-05T00:00:00.000Z' } },
      };
      const patrolTrackDataAtVirtualDate = selectPatrolTrackData(state, patrol);

      expect(patrolTrackDataAtVirtualDate.subjectsTrackData).toBe(patrolTrackData.subjectsTrackData);
      expect(patrolTrackDataAtVirtualDate.trackData).toBe(patrolTrackData.trackData);
    });

    test('reads the same start and stop markers the views reporting on the patrol do', () => {
      expect(selectPatrolMapTrackData(state, patrol).startStopGeometries)
        .toBe(selectPatrolTrackData(state, patrol).startStopGeometries);
    });
  });

  describe('selectPatrolLeadSumDistance', () => {
    const ASSET = { id: 'subjectAsset', name: 'KTN-123' };
    const FIRST_LEAD = { id: 'subjectFirstLead', name: 'Maya Chen' };
    const MEMBER = { id: 'subjectMember', name: 'Pilot Zoe' };
    const SECOND_LEAD = { id: 'subjectSecondLead', name: 'Jordan Reeves' };

    const trackWithTimes = (coordinates, times) => ({
      fetchedDateRange: { since: '2020-01-01T00:00:00.000Z' },
      points: { features: [] },
      track: {
        features: [{
          geometry: { type: 'LineString', coordinates },
          properties: { coordinateProperties: { times } },
        }],
      },
    });

    const patrolSegment = (leader, startTime, endTime, patrolSegmentProps = {}) => ({
      leader,
      time_range: { end_time: endTime, start_time: startTime },
      ...patrolSegmentProps,
    });

    beforeAll(() => {
      jest.useFakeTimers().setSystemTime(new Date('2020-01-10'));
    });

    beforeEach(() => {
      state.data.patrolTeamAndTrackingOptions.assets = [ASSET];
      state.data.patrolTeamAndTrackingOptions.members = [MEMBER];
      state.data.tracks = {
        [ASSET.id]: trackWithTimes(
          [[3, 4], [3, 2], [3, 0]],
          ['2020-01-09T00:00:00.000Z', '2020-01-05T00:00:00.000Z', '2020-01-01T00:00:00.000Z']
        ),
        [FIRST_LEAD.id]: trackWithTimes(
          [[0, 2], [0, 1], [0, 0]],
          ['2020-01-09T00:00:00.000Z', '2020-01-05T00:00:00.000Z', '2020-01-01T00:00:00.000Z']
        ),
        [MEMBER.id]: trackWithTimes(
          [[2, 2], [2, 1], [2, 0]],
          ['2020-01-09T00:00:00.000Z', '2020-01-05T00:00:00.000Z', '2020-01-01T00:00:00.000Z']
        ),
        [SECOND_LEAD.id]: trackWithTimes(
          [[1, 2], [1, 1], [1, 0]],
          ['2020-01-09T00:00:00.000Z', '2020-01-05T00:00:00.000Z', '2020-01-01T00:00:00.000Z']
        ),
      };
    });

    test('adds up what the lead of every leg covered on its own leg', () => {
      const patrol = {
        state: 'done',
        patrol_segments: [
          patrolSegment(FIRST_LEAD, '2020-01-01T00:00:00.000Z', '2020-01-05T00:00:00.000Z'),
          patrolSegment(SECOND_LEAD, '2020-01-05T00:00:00.000Z', '2020-01-09T00:00:00.000Z'),
        ],
      };

      const firstLegDistance = selectPatrolLeadSumDistance(state, {
        ...patrol,
        patrol_segments: [patrol.patrol_segments[0]],
      });
      const secondLegDistance = selectPatrolLeadSumDistance(state, {
        ...patrol,
        patrol_segments: [patrol.patrol_segments[1]],
      });

      expect(selectPatrolLeadSumDistance(state, patrol)).toBeCloseTo(firstLegDistance + secondLegDistance);
    });

    test('counts the ground a lead covered on its own leg alone', () => {
      const wholePatrolDistance = selectPatrolLeadSumDistance(state, {
        state: 'done',
        patrol_segments: [patrolSegment(FIRST_LEAD, '2020-01-01T00:00:00.000Z', '2020-01-09T00:00:00.000Z')],
      });
      const firstHalfDistance = selectPatrolLeadSumDistance(state, {
        state: 'done',
        patrol_segments: [patrolSegment(FIRST_LEAD, '2020-01-01T00:00:00.000Z', '2020-01-05T00:00:00.000Z')],
      });

      expect(firstHalfDistance).toBeLessThan(wholePatrolDistance);
    });

    test('counts none of the ground covered while the patrol was paused', () => {
      const patrolWithoutPause = {
        state: 'done',
        patrol_segments: [
          patrolSegment(FIRST_LEAD, '2020-01-01T00:00:00.000Z', '2020-01-05T00:00:00.000Z'),
          patrolSegment(FIRST_LEAD, '2020-01-09T00:00:00.000Z', '2020-01-09T00:00:00.000Z'),
        ],
      };
      const patrolWithPause = {
        state: 'done',
        patrol_segments: [
          patrolWithoutPause.patrol_segments[0],
          patrolSegment(FIRST_LEAD, '2020-01-05T00:00:00.000Z', '2020-01-09T00:00:00.000Z', { is_pause: true }),
          patrolWithoutPause.patrol_segments[1],
        ],
      };

      expect(selectPatrolLeadSumDistance(state, patrolWithPause))
        .toBeCloseTo(selectPatrolLeadSumDistance(state, patrolWithoutPause));
    });

    test('leaves the distance unknown while no leg leader has a track', () => {
      const patrol = {
        state: 'done',
        patrol_segments: [patrolSegment({ id: 'subjectUntracked' }, '2020-01-01T00:00:00.000Z', null)],
      };

      expect(selectPatrolLeadSumDistance(state, patrol)).toBeNull();
    });

    test('leaves the distance unknown for a patrol that has not begun', () => {
      const patrol = {
        state: 'open',
        patrol_segments: [{ leader: FIRST_LEAD, time_range: {} }],
      };

      expect(selectPatrolLeadSumDistance(state, patrol)).toBeNull();
    });

    test('keeps the whole of what the leads covered, whatever the track length setting draws', () => {
      state.view.trackSettings.length = 1;

      const patrol = {
        state: 'done',
        patrol_segments: [patrolSegment(FIRST_LEAD, '2020-01-01T00:00:00.000Z', '2020-01-09T00:00:00.000Z')],
      };

      expect(selectPatrolLeadSumDistance(state, patrol)).toBeGreaterThan(0);
    });

    describe('on a leg with no lead', () => {
      const legWithoutLead = patrolSegment(null, '2020-01-01T00:00:00.000Z', '2020-01-09T00:00:00.000Z', {
        assets: [ASSET.id],
        members: [MEMBER.id],
      });

      test('stands on the subject it tracks that went furthest', () => {
        const assetDistance = selectPatrolLeadSumDistance(state, {
          state: 'done',
          patrol_segments: [{ ...legWithoutLead, members: [] }],
        });

        expect(selectPatrolLeadSumDistance(state, { state: 'done', patrol_segments: [legWithoutLead] }))
          .toBeCloseTo(assetDistance);
      });

      test('stands on its own lead once it has one', () => {
        const leadDistance = selectPatrolLeadSumDistance(state, {
          state: 'done',
          patrol_segments: [{ ...legWithoutLead, leader: FIRST_LEAD }],
        });

        expect(leadDistance)
          .toBeLessThan(selectPatrolLeadSumDistance(state, { state: 'done', patrol_segments: [legWithoutLead] }));
      });

      test('leaves the distance unknown while none of its subjects has a track', () => {
        const patrol = {
          state: 'done',
          patrol_segments: [{ ...legWithoutLead, assets: ['subjectUntracked'], members: [] }],
        };

        expect(selectPatrolLeadSumDistance(state, patrol)).toBeNull();
      });

      test('leaves the distance unknown while only some of its subjects have a track', () => {
        state.data.tracks = omit(state.data.tracks, ASSET.id);

        expect(selectPatrolLeadSumDistance(state, { state: 'done', patrol_segments: [legWithoutLead] })).toBeNull();
      });
    });
  });

  describe('selectPatrolSegmentsTrackData', () => {
    const LEAD = { id: 'subjectLead', name: 'Maya Chen' };
    const ASSET = { id: 'subjectAsset', name: 'KTN-123' };

    const trackWithTimes = (coordinates, times) => ({
      fetchedDateRange: { since: '2020-01-01T00:00:00.000Z' },
      points: { features: [] },
      track: {
        features: [{
          geometry: { type: 'LineString', coordinates },
          properties: { coordinateProperties: { times } },
        }],
      },
    });

    const patrol = {
      state: 'done',
      patrol_segments: [
        {
          assets: [ASSET.id],
          leader: LEAD,
          time_range: { end_time: '2020-01-05T00:00:00.000Z', start_time: '2020-01-01T00:00:00.000Z' },
        },
        {
          leader: LEAD,
          time_range: { end_time: '2020-01-09T00:00:00.000Z', start_time: '2020-01-05T00:00:00.000Z' },
        },
      ],
    };

    beforeAll(() => {
      jest.useFakeTimers().setSystemTime(new Date('2020-01-10'));
    });

    beforeEach(() => {
      state.data.patrolTeamAndTrackingOptions.assets = [ASSET];
      state.data.tracks = {
        [ASSET.id]: trackWithTimes(
          [[1, 2], [1, 1], [1, 0]],
          ['2020-01-05T00:00:00.000Z', '2020-01-03T00:00:00.000Z', '2020-01-01T00:00:00.000Z']
        ),
        [LEAD.id]: trackWithTimes(
          [[0, 4], [0, 3], [0, 2], [0, 1], [0, 0]],
          [
            '2020-01-09T00:00:00.000Z',
            '2020-01-07T00:00:00.000Z',
            '2020-01-05T00:00:00.000Z',
            '2020-01-03T00:00:00.000Z',
            '2020-01-01T00:00:00.000Z',
          ]
        ),
      };
    });

    test('gives every leg the tracks of all the subjects it tracks', () => {
      const [firstLegTrackData, secondLegTrackData] = selectPatrolSegmentsTrackData(state, patrol);

      expect(firstLegTrackData.track.features.map(({ geometry }) => geometry.coordinates)).toEqual([
        [[0, 2], [0, 1], [0, 0]],
        [[1, 2], [1, 1], [1, 0]],
      ]);
      expect(secondLegTrackData.track.features.map(({ geometry }) => geometry.coordinates)).toEqual([
        [[0, 4], [0, 3], [0, 2]],
      ]);
    });

    test('keeps the subjects the user hid in the legend', () => {
      state.view.patrolTrackState.hiddenSubjects = { [patrol.id]: [ASSET.id] };

      const [firstLegTrackData] = selectPatrolSegmentsTrackData(state, patrol);

      expect(firstLegTrackData.track.features.map(({ geometry }) => geometry.coordinates)).toEqual([
        [[0, 2], [0, 1], [0, 0]],
        [[1, 2], [1, 1], [1, 0]],
      ]);
    });

    test('keeps the whole of a leg, whatever the track length setting draws', () => {
      state.view.trackSettings.length = 1;

      const [firstLegTrackData] = selectPatrolSegmentsTrackData(state, patrol);

      expect(firstLegTrackData.track.features.map(({ geometry }) => geometry.coordinates)).toEqual([
        [[0, 2], [0, 1], [0, 0]],
        [[1, 2], [1, 1], [1, 0]],
      ]);
    });

    test('gives no track data to a leg that never started', () => {
      const patrolWithPlannedLeg = {
        ...patrol,
        patrol_segments: [...patrol.patrol_segments, { leader: LEAD, time_range: {} }],
      };

      expect(selectPatrolSegmentsTrackData(state, patrolWithPlannedLeg)[2]).toBeNull();
    });
  });

  describe('selectPatrolTrackedSubjects', () => {
    const RANGER = { id: 'subject111', name: 'Ranger Amara' };
    const DOG = { id: 'subject222', name: 'K9 Rex' };

    const FIRST_LEG_TIME_RANGE = { end_time: '2020-01-05T00:00:00.000Z', start_time: '2020-01-01T00:00:00.000Z' };
    const SECOND_LEG_TIME_RANGE = { end_time: '2020-01-09T00:00:00.000Z', start_time: '2020-01-05T00:00:00.000Z' };

    // A degree of longitude at the equator, so every leg covers the same distance.
    const ONE_DEGREE_IN_KILOMETERS = 111.19;

    // Tracks are stored most recent position first.
    const trackFor = (coordinates, times) => ({
      fetchedDateRange: { since: times[times.length - 1] },
      points: { features: [] },
      track: {
        features: [{
          geometry: { coordinates, type: 'LineString' },
          properties: { coordinateProperties: { times } },
          type: 'Feature',
        }],
        type: 'FeatureCollection',
      },
    });

    const legFor = (leader, timeRange) => ({ assets: [], leader, members: [], time_range: timeRange });

    const twoLeggedPatrol = {
      patrol_segments: [legFor(RANGER, FIRST_LEG_TIME_RANGE), legFor(DOG, SECOND_LEG_TIME_RANGE)],
    };

    beforeEach(() => {
      state.data.tracks = {
        [DOG.id]: trackFor(
          [[1, 0], [0, 0]],
          [SECOND_LEG_TIME_RANGE.end_time, SECOND_LEG_TIME_RANGE.start_time]
        ),
        [RANGER.id]: trackFor(
          [[1, 0], [0, 0]],
          [FIRST_LEG_TIME_RANGE.end_time, FIRST_LEG_TIME_RANGE.start_time]
        ),
      };
    });

    test('lists the subject tracked by every leg with the distance it covered, the team lead first', () => {
      const trackedSubjects = selectPatrolTrackedSubjects(state, twoLeggedPatrol);

      expect(trackedSubjects.map((trackedSubject) => [trackedSubject.subject.id, trackedSubject.isTeamLead])).toEqual([
        [DOG.id, true],
        [RANGER.id, false],
      ]);
      trackedSubjects.forEach(({ distance }) => expect(distance).toBeCloseTo(ONE_DEGREE_IN_KILOMETERS, 1));
    });

    test('adds up the distance a subject covered across every leg it took part in', () => {
      const singleSubjectPatrol = {
        patrol_segments: [legFor(RANGER, FIRST_LEG_TIME_RANGE), legFor(RANGER, SECOND_LEG_TIME_RANGE)],
      };
      state.data.tracks = {
        [RANGER.id]: trackFor(
          [[2, 0], [1, 0], [0, 0]],
          [SECOND_LEG_TIME_RANGE.end_time, FIRST_LEG_TIME_RANGE.end_time, FIRST_LEG_TIME_RANGE.start_time]
        ),
      };

      const trackedSubjects = selectPatrolTrackedSubjects(state, singleSubjectPatrol);

      expect(trackedSubjects).toHaveLength(1);
      expect(trackedSubjects[0].distance).toBeCloseTo(2 * ONE_DEGREE_IN_KILOMETERS, 1);
    });

    describe('when the legs of a patrol overlap', () => {
      const legsSharingATrack = (...timeRanges) => ({
        patrol_segments: timeRanges.map((timeRange) => legFor(RANGER, timeRange)),
      });

      beforeEach(() => {
        state.data.tracks = {
          [RANGER.id]: trackFor(
            [[2, 0], [1, 0], [0, 0]],
            [SECOND_LEG_TIME_RANGE.end_time, FIRST_LEG_TIME_RANGE.end_time, FIRST_LEG_TIME_RANGE.start_time]
          ),
        };
      });

      test('counts the stretch they share once', () => {
        const patrol = legsSharingATrack(
          { end_time: SECOND_LEG_TIME_RANGE.end_time, start_time: FIRST_LEG_TIME_RANGE.start_time },
          SECOND_LEG_TIME_RANGE
        );

        expect(selectPatrolTrackedSubjects(state, patrol)[0].distance)
          .toBeCloseTo(2 * ONE_DEGREE_IN_KILOMETERS, 1);
      });

      test('counts the stretch they share once when the earlier leg carries no end', () => {
        const patrol = legsSharingATrack(
          { end_time: null, start_time: FIRST_LEG_TIME_RANGE.start_time },
          SECOND_LEG_TIME_RANGE
        );

        expect(selectPatrolTrackedSubjects(state, patrol)[0].distance)
          .toBeCloseTo(2 * ONE_DEGREE_IN_KILOMETERS, 1);
      });

      test('still adds up the legs that do not overlap, whatever order they come in', () => {
        const patrol = legsSharingATrack(SECOND_LEG_TIME_RANGE, FIRST_LEG_TIME_RANGE);

        expect(selectPatrolTrackedSubjects(state, patrol)[0].distance)
          .toBeCloseTo(2 * ONE_DEGREE_IN_KILOMETERS, 1);
      });
    });

    test('leaves out the ground a subject covered while the patrol was paused', () => {
      const pausedPatrol = {
        patrol_segments: [
          legFor(RANGER, FIRST_LEG_TIME_RANGE),
          { ...legFor(RANGER, SECOND_LEG_TIME_RANGE), is_pause: true },
        ],
      };
      state.data.tracks = {
        [RANGER.id]: trackFor(
          [[2, 0], [1, 0], [0, 0]],
          [SECOND_LEG_TIME_RANGE.end_time, FIRST_LEG_TIME_RANGE.end_time, FIRST_LEG_TIME_RANGE.start_time]
        ),
      };

      expect(selectPatrolTrackedSubjects(state, pausedPatrol)[0].distance)
        .toBeCloseTo(ONE_DEGREE_IN_KILOMETERS, 1);
    });

    test('counts only the stretch of the track that falls within the leg time range', () => {
      const patrolWithinALongerTrack = {
        patrol_segments: [legFor(RANGER, FIRST_LEG_TIME_RANGE)],
      };
      state.data.tracks = {
        [RANGER.id]: trackFor(
          [[3, 0], [2, 0], [1, 0], [0, 0]],
          [
            SECOND_LEG_TIME_RANGE.end_time,
            FIRST_LEG_TIME_RANGE.end_time,
            FIRST_LEG_TIME_RANGE.start_time,
            '2019-12-31T00:00:00.000Z',
          ]
        ),
      };

      expect(selectPatrolTrackedSubjects(state, patrolWithinALongerTrack)[0].distance)
        .toBeCloseTo(ONE_DEGREE_IN_KILOMETERS, 1);
    });

    test('leaves the distance unknown for a subject whose track is not loaded', () => {
      state.data.tracks = {};

      expect(selectPatrolTrackedSubjects(state, twoLeggedPatrol).map(({ distance }) => distance))
        .toEqual([null, null]);
    });

    test('leaves the distance unknown only for the subjects whose track is not loaded', () => {
      state.data.tracks = { [RANGER.id]: state.data.tracks[RANGER.id] };

      const trackedSubjects = selectPatrolTrackedSubjects(state, twoLeggedPatrol);

      expect(trackedSubjects[0].distance).toBeNull();
      expect(trackedSubjects[1].distance).toBeCloseTo(ONE_DEGREE_IN_KILOMETERS, 1);
    });

    test('counts no distance for a leg without a start time', () => {
      const patrolWithoutLegStartTime = {
        patrol_segments: [legFor(RANGER, { end_time: FIRST_LEG_TIME_RANGE.end_time })],
      };

      expect(selectPatrolTrackedSubjects(state, patrolWithoutLegStartTime)[0].distance).toBe(0);
    });

    test('counts no distance for a leg whose time range falls outside the fetched track', () => {
      const patrolOutsideTheFetchedTrack = {
        patrol_segments: [
          legFor(RANGER, { end_time: '2019-12-05T00:00:00.000Z', start_time: '2019-12-01T00:00:00.000Z' }),
        ],
      };

      expect(selectPatrolTrackedSubjects(state, patrolOutsideTheFetchedTrack)[0].distance).toBe(0);
    });

    test('returns an empty list for a patrol whose legs have no leader', () => {
      const patrolWithoutLeaders = { patrol_segments: [legFor(null, FIRST_LEG_TIME_RANGE)] };

      expect(selectPatrolTrackedSubjects(state, patrolWithoutLeaders)).toEqual([]);
    });

    test('returns an empty list for a patrol without legs', () => {
      expect(selectPatrolTrackedSubjects(state, { patrol_segments: [] })).toEqual([]);
    });

    test('does not recompute the distances when an unrelated subject\'s track updates', () => {
      const firstResult = selectPatrolTrackedSubjects(state, twoLeggedPatrol);

      state = {
        ...state,
        data: {
          ...state.data,
          tracks: { ...state.data.tracks, subject999: { unrelated: true } },
        },
      };

      expect(selectPatrolTrackedSubjects(state, twoLeggedPatrol)).toBe(firstResult);
    });

    test('locates a tracked subject at its most recent tracked position', () => {
      state.data.tracks = {
        [DOG.id]: {
          ...trackFor([[1, 0], [0, 0]], [SECOND_LEG_TIME_RANGE.end_time, SECOND_LEG_TIME_RANGE.start_time]),
          points: { features: [{ geometry: { type: 'Point', coordinates: [1, 0] } }] },
        },
      };
      const patrol = { patrol_segments: [legFor(DOG, SECOND_LEG_TIME_RANGE)] };

      expect(selectPatrolTrackedSubjects(state, patrol)[0].coordinates).toEqual([1, 0]);
    });

    test('falls back to the last known position of a tracked subject whose track is not loaded', () => {
      const patrolWithoutTracks = {
        patrol_segments: [legFor({ ...DOG, last_position: { geometry: { type: 'LineString', coordinates: [5, 6] } } }, FIRST_LEG_TIME_RANGE)],
      };
      state.data.tracks = {};

      expect(selectPatrolTrackedSubjects(state, patrolWithoutTracks)[0].coordinates).toEqual([5, 6]);
    });

    test('falls back to the last position the subject store knows for a tracked subject', () => {
      const patrolWithoutTracks = { patrol_segments: [legFor(DOG, FIRST_LEG_TIME_RANGE)] };
      state.data.subjectStore = { [DOG.id]: { last_position: { geometry: { type: 'LineString', coordinates: [7, 8] } } } };
      state.data.tracks = {};

      expect(selectPatrolTrackedSubjects(state, patrolWithoutTracks)[0].coordinates).toEqual([7, 8]);
    });

    test('leaves a tracked subject nothing has located without coordinates', () => {
      const patrolWithoutTracks = { patrol_segments: [legFor(DOG, FIRST_LEG_TIME_RANGE)] };
      state.data.tracks = {};

      expect(selectPatrolTrackedSubjects(state, patrolWithoutTracks)[0].coordinates).toBeNull();
    });
  });

  describe('selectPatrolSegmentTrackedSubjects', () => {
    const ASSET = { id: 'subjectAsset', name: 'KTN-123' };
    const LEAD = { id: 'subjectLead', name: 'Maya Chen' };

    const LEG_TIME_RANGE = { end_time: '2020-01-05T00:00:00.000Z', start_time: '2020-01-01T00:00:00.000Z' };

    beforeAll(() => {
      jest.useFakeTimers().setSystemTime(new Date('2020-01-10'));
    });

    beforeEach(() => {
      state.data.patrolTeamAndTrackingOptions.assets = [ASSET];
      state.data.tracks = {
        [ASSET.id]: {
          fetchedDateRange: { since: LEG_TIME_RANGE.start_time },
          points: { features: [] },
          track: {
            features: [{
              geometry: { coordinates: [[2, 0], [0, 0]], type: 'LineString' },
              properties: {
                coordinateProperties: { times: [LEG_TIME_RANGE.end_time, LEG_TIME_RANGE.start_time] },
              },
            }],
          },
        },
      };
    });

    test('lists what every subject the leg tracks covered on it, its lead first', () => {
      const patrolSegment = { assets: [ASSET.id], leader: LEAD, time_range: LEG_TIME_RANGE };
      const patrol = { patrol_segments: [patrolSegment] };

      const patrolSegmentTrackedSubjects = selectPatrolSegmentTrackedSubjects(state, patrol, patrolSegment);

      expect(patrolSegmentTrackedSubjects.map(({ subject }) => subject.id)).toEqual([LEAD.id, ASSET.id]);
      expect(patrolSegmentTrackedSubjects[0].isTeamLead).toBe(true);
      expect(patrolSegmentTrackedSubjects[0].distance).toBeNull();
      expect(patrolSegmentTrackedSubjects[1].distance).toBeCloseTo(222.39, 1);
    });

    test('lists nobody for a pause', () => {
      const patrolSegment = { assets: [ASSET.id], is_pause: true, leader: LEAD, time_range: LEG_TIME_RANGE };
      const patrol = { patrol_segments: [patrolSegment] };

      expect(selectPatrolSegmentTrackedSubjects(state, patrol, patrolSegment)).toEqual([]);
    });
  });

  describe('selectPatrolsWithTracksTrackedSubjectRequests', () => {
    const ASSET = { id: 'subjectAsset', name: 'KTN-123' };
    const LEAD = { id: 'subjectLead', name: 'Maya Chen' };

    const patrol = {
      id: 'patrol123',
      patrol_segments: [
        {
          assets: [ASSET.id],
          leader: LEAD,
          time_range: { end_time: '2020-01-05T00:00:00.000Z', start_time: '2020-01-01T00:00:00.000Z' },
        },
        {
          is_pause: true,
          time_range: { end_time: '2020-01-06T00:00:00.000Z', start_time: '2020-01-05T00:00:00.000Z' },
        },
      ],
      state: 'open',
    };

    beforeAll(() => {
      jest.useFakeTimers().setSystemTime(new Date('2020-01-10'));
    });

    beforeEach(() => {
      state.data.patrolStore = { [patrol.id]: patrol };
      state.data.patrolTeamAndTrackingOptions.assets = [ASSET];
      state.view.patrolTrackState.visible = [patrol.id];
    });

    test('asks for every subject a drawn patrol tracks, over the times its legs ran', () => {
      expect(selectPatrolsWithTracksTrackedSubjectRequests(state)).toEqual([
        { since: '2020-01-01T00:00:00.000Z', subjectId: LEAD.id, until: '2020-01-05T00:00:00.000Z' },
        { since: '2020-01-01T00:00:00.000Z', subjectId: ASSET.id, until: '2020-01-05T00:00:00.000Z' },
      ]);
    });

    test('asks once for a subject on several legs, over all of them at once', () => {
      state.data.patrolStore[patrol.id] = {
        ...patrol,
        patrol_segments: [
          ...patrol.patrol_segments,
          {
            assets: [ASSET.id],
            time_range: { end_time: '2020-01-08T00:00:00.000Z', start_time: '2020-01-06T00:00:00.000Z' },
          },
        ],
      };

      expect(selectPatrolsWithTracksTrackedSubjectRequests(state)).toEqual([
        { since: '2020-01-01T00:00:00.000Z', subjectId: LEAD.id, until: '2020-01-05T00:00:00.000Z' },
        { since: '2020-01-01T00:00:00.000Z', subjectId: ASSET.id, until: '2020-01-08T00:00:00.000Z' },
      ]);
    });

    test('asks up to now for a subject whose leg has not ended', () => {
      state.data.patrolStore[patrol.id] = {
        ...patrol,
        patrol_segments: [
          ...patrol.patrol_segments,
          { assets: [ASSET.id], time_range: { start_time: '2020-01-06T00:00:00.000Z' } },
        ],
      };

      expect(selectPatrolsWithTracksTrackedSubjectRequests(state)).toContainEqual(
        { since: '2020-01-01T00:00:00.000Z', subjectId: ASSET.id, until: null }
      );
    });

    test('asks for nothing while no patrol track is drawn', () => {
      state.view.patrolTrackState.visible = [];

      expect(selectPatrolsWithTracksTrackedSubjectRequests(state)).toEqual([]);
    });
  });

  describe('selectPatrolMeasuredSubjectIds', () => {
    const ASSET = { id: 'subjectAsset', name: 'KTN-123' };
    const LEAD = { id: 'subjectLead', name: 'Maya Chen' };
    const MEMBER = { id: 'subjectMember', name: 'Pilot Zoe' };

    beforeAll(() => {
      jest.useFakeTimers().setSystemTime(new Date('2020-01-10'));
    });

    beforeEach(() => {
      state.data.patrolTeamAndTrackingOptions.assets = [ASSET];
      state.data.patrolTeamAndTrackingOptions.members = [MEMBER];
    });

    test('names only the lead of a leg that has one', () => {
      const patrol = {
        patrol_segments: [{
          assets: [ASSET.id],
          leader: LEAD,
          members: [MEMBER.id],
          time_range: { end_time: '2020-01-05T00:00:00.000Z', start_time: '2020-01-01T00:00:00.000Z' },
        }],
      };

      expect(selectPatrolMeasuredSubjectIds(state, patrol)).toEqual([LEAD.id]);
    });

    test('names everyone a leg with no lead tracks', () => {
      const patrol = {
        patrol_segments: [{
          assets: [ASSET.id],
          leader: null,
          members: [MEMBER.id],
          time_range: { end_time: '2020-01-05T00:00:00.000Z', start_time: '2020-01-01T00:00:00.000Z' },
        }],
      };

      expect(selectPatrolMeasuredSubjectIds(state, patrol)).toEqual([MEMBER.id, ASSET.id]);
    });

    test('names nobody from a pause or from a leg that has not begun', () => {
      const patrol = {
        patrol_segments: [
          {
            is_pause: true,
            leader: LEAD,
            time_range: { end_time: '2020-01-05T00:00:00.000Z', start_time: '2020-01-01T00:00:00.000Z' },
          },
          { leader: MEMBER, time_range: { end_time: null, start_time: '2030-01-01T00:00:00.000Z' } },
        ],
      };

      expect(selectPatrolMeasuredSubjectIds(state, patrol)).toEqual([]);
    });
  });

  describe('selectPatrolRosterFallbackSubjects', () => {
    const DEACTIVATED_RANGER = { id: 'subject333', name: 'Ranger Kofi' };
    const OFFERED_RANGER = { id: 'subject111', name: 'Ranger Amara' };

    test('looks up the subjects a leg names that the rosters no longer offer', () => {
      state.data.patrolTeamAndTrackingOptions.members = [OFFERED_RANGER];
      state.data.subjectStore = { [DEACTIVATED_RANGER.id]: DEACTIVATED_RANGER };

      const patrol = { patrol_segments: [{ members: [OFFERED_RANGER.id, DEACTIVATED_RANGER.id] }] };

      expect(selectPatrolRosterFallbackSubjects(state, patrol))
        .toEqual({ [DEACTIVATED_RANGER.id]: DEACTIVATED_RANGER });
    });

    test('holds nothing while the rosters offer every subject the legs name', () => {
      state.data.patrolTeamAndTrackingOptions.members = [OFFERED_RANGER];
      state.data.subjectStore = { [OFFERED_RANGER.id]: OFFERED_RANGER };

      expect(selectPatrolRosterFallbackSubjects(state, { patrol_segments: [{ members: [OFFERED_RANGER.id] }] }))
        .toEqual({});
    });
  });

  describe('selectTrackedSubjectsPerPatrolSegment', () => {
    const RANGER = { id: 'subject111', name: 'Ranger Amara' };
    const DOG = { id: 'subject222', name: 'K9 Rex' };

    const legFor = (leader) => ({ assets: [], leader, members: [] });

    test('lists the subjects of every leg, aligned with the legs of the patrol', () => {
      const patrol = { patrol_segments: [legFor(RANGER), legFor(DOG)] };

      expect(selectTrackedSubjectsPerPatrolSegment(state, patrol).map(
        (trackedSubjects) => trackedSubjects.map((trackedSubject) => trackedSubject.subject.id)
      )).toEqual([[RANGER.id], [DOG.id]]);
    });

    test('marks the leader of each leg as its own', () => {
      const patrol = { patrol_segments: [legFor(RANGER), legFor(DOG)] };

      expect(selectTrackedSubjectsPerPatrolSegment(state, patrol).map(
        (trackedSubjects) => trackedSubjects.map((trackedSubject) => trackedSubject.isTeamLead)
      )).toEqual([[true], [true]]);
    });

    test('leaves the legs that track nothing empty', () => {
      const patrol = { patrol_segments: [legFor(null), legFor(DOG)] };

      expect(selectTrackedSubjectsPerPatrolSegment(state, patrol)[0]).toEqual([]);
    });
  });

  describe('selectPatrolLeadersWithLastPosition', () => {
    test('gets the patrol leaders and their last positions', () => {
      state.data.patrolTeamAndTrackingOptions = { leaders: [
        { id: 'subject123', last_position: {}, last_position_status: {} },
        { id: 'subject456' },
      ] };
      state.data.subjectStore = {
        subject456: {
          last_position: {},
          last_position_status: {},
        },
      };
      expect(selectPatrolLeadersWithLastPosition(state)).toEqual([
        { id: 'subject123', last_position: {}, last_position_status: {} },
        { id: 'subject456', last_position: {}, last_position_status: {} },
      ]);
    });

    test('keeps the list it has when a subject store change fills nothing in', () => {
      state.data.patrolTeamAndTrackingOptions = {
        leaders: [{ id: 'subject123', last_position: {}, last_position_status: {} }],
      };

      const firstResult = selectPatrolLeadersWithLastPosition(state);

      state.data.subjectStore = { ...state.data.subjectStore, subject999: { last_position: {} } };

      expect(selectPatrolLeadersWithLastPosition(state)).toBe(firstResult);
    });
  });

  describe('selectPatrolsWithTracks', () => {
    beforeAll(() => {
      jest.useFakeTimers().setSystemTime(new Date('2020-01-15'));
    });

    test('gets the patrols that have their tracks pinned or visible', () => {
      state.view.patrolTrackState.pinned = ['patrol123'];
      state.view.patrolTrackState.visible = ['patrol456'];
      state.data.patrolStore = {
        patrol123: {
          patrol_segments: [
            {
              time_range: {
                end_time: '2020-01-10T00:00:00.000Z',
                start_time: '2020-01-01T00:00:00.000Z',
              },
            },
          ],
        },
        patrol456: {
          patrol_segments: [
            {
              time_range: {
                end_time: '2020-01-20T00:00:00.000Z',
                start_time: '2020-01-10T00:00:00.000Z',
              },
            },
          ],
        },
      };
      expect(selectPatrolsWithTracks(state)).toEqual([
        {
          patrol_segments: [
            {
              time_range: {
                end_time: '2020-01-20T00:00:00.000Z',
                start_time: '2020-01-10T00:00:00.000Z',
              },
            },
          ],
        },
        {
          patrol_segments: [
            {
              time_range: {
                end_time: '2020-01-10T00:00:00.000Z',
                start_time: '2020-01-01T00:00:00.000Z',
              },
            },
          ],
        },
      ]);
    });
  });

  describe('selectIsPatrolTrackShown', () => {
    beforeAll(() => {
      jest.useFakeTimers().setSystemTime(new Date('2020-01-15'));
    });

    beforeEach(() => {
      state.data.patrolStore = {
        patrol123: {
          id: 'patrol123',
          patrol_segments: [{ time_range: { end_time: null, start_time: '2020-01-01T00:00:00.000Z' } }],
        },
      };
    });

    test('tells that the track of a patrol the user pinned is shown', () => {
      state.view.patrolTrackState.pinned = ['patrol123'];

      expect(selectIsPatrolTrackShown(state, 'patrol123')).toBe(true);
    });

    test('tells that the track of a patrol the user made visible is shown', () => {
      state.view.patrolTrackState.visible = ['patrol123'];

      expect(selectIsPatrolTrackShown(state, 'patrol123')).toBe(true);
    });

    test('tells that the track of a patrol the user has hidden is not shown', () => {
      expect(selectIsPatrolTrackShown(state, 'patrol123')).toBe(false);
    });

    test('tells that the track of a patrol that has not begun is not shown', () => {
      state.data.patrolStore.patrol123.patrol_segments = [{ time_range: { end_time: null, start_time: null } }];
      state.view.patrolTrackState.visible = ['patrol123'];

      expect(selectIsPatrolTrackShown(state, 'patrol123')).toBe(false);
    });

    test('tells that no track is shown for a patrol that does not exist yet', () => {
      state.view.patrolTrackState.visible = ['patrol123'];

      expect(selectIsPatrolTrackShown(state, null)).toBe(false);
    });
  });

  describe('selectPatrolsWithTracksData', () => {
    beforeAll(() => {
      jest.useFakeTimers().setSystemTime(new Date('2020-01-15'));
    });

    test('gets the patrols that have their tracks pinned or visible', () => {
      state.view.patrolTrackState.pinned = ['patrol123'];
      state.view.patrolTrackState.visible = ['patrol456'];
      state.data.patrolStore = {
        patrol123: {
          patrol_segments: [
            {
              leader: {
                id: 'subject123',
              },
              time_range: {
                end_time: '2020-01-10T00:00:00.000Z',
                start_time: '2020-01-01T00:00:00.000Z',
              },
            },
          ],
        },
        patrol456: {
          patrol_segments: [
            {
              leader: {
                id: 'subject456',
              },
              time_range: {
                end_time: '2020-01-20T00:00:00.000Z',
                start_time: '2020-01-10T00:00:00.000Z',
              },
            },
          ],
        },
      };
      state.data.tracks = {
        subject123: {
          fetchedDateRange: {
            since: '2020-01-01T00:00:00.000Z',
          },
          points: {
            features: [],
          },
          track: {
            features: [
              {
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [0, 0],
                    [0, 1],
                    [0, 2],
                  ],
                },
                properties: {
                  coordinateProperties: {
                    times: [
                      '2020-01-01T00:00:00.000Z',
                      '2020-01-03T00:00:00.000Z',
                      '2020-01-05T00:00:00.000Z',
                    ],
                  },
                },
              },
            ],
          },
        },
        subject456: {
          fetchedDateRange: {
            since: '2020-01-01T00:00:00.000Z',
          },
          points: {
            features: [],
          },
          track: {
            features: [
              {
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [0, 0],
                    [1, 0],
                    [2, 0],
                  ],
                },
                properties: {
                  coordinateProperties: {
                    times: [
                      '2020-01-11T00:00:00.000Z',
                      '2020-01-13T00:00:00.000Z',
                      '2020-01-15T00:00:00.000Z',
                    ],
                  },
                },
              },
            ],
          },
        },
      };
      const patrolsWithTracksData = selectPatrolsWithTracksData(state);

      expect(patrolsWithTracksData.map(({ patrol }) => patrol)).toEqual([
        state.data.patrolStore.patrol456,
        state.data.patrolStore.patrol123,
      ]);
      expect(patrolsWithTracksData.map(({ leader }) => leader.id)).toEqual(['subject456', 'subject123']);
      expect(patrolsWithTracksData.map(({ subjectsTrackData }) =>
        subjectsTrackData.map(({ subject }) => subject.id))).toEqual([['subject456'], ['subject123']]);
      expect(patrolsWithTracksData.map(({ trackData }) =>
        trackData.track.features[0].geometry.coordinates)).toEqual([
        [[0, 0], [1, 0], [2, 0]],
        [[0, 0], [0, 1], [0, 2]],
      ]);
    });

    test('reads the track data the map layers already built', () => {
      state.view.patrolTrackState.visible = ['patrol123'];
      state.data.patrolStore = {
        patrol123: {
          id: 'patrol123',
          state: 'done',
          patrol_segments: [{
            leader: { id: 'subject123' },
            time_range: { end_time: '2020-01-09T00:00:00.000Z', start_time: '2020-01-01T00:00:00.000Z' },
          }],
        },
      };
      state.data.tracks = {
        subject123: {
          fetchedDateRange: { since: '2020-01-01T00:00:00.000Z' },
          points: { features: [] },
          track: {
            features: [{
              geometry: { type: 'LineString', coordinates: [[0, 2], [0, 1], [0, 0]] },
              properties: {
                coordinateProperties: {
                  times: ['2020-01-09T00:00:00.000Z', '2020-01-05T00:00:00.000Z', '2020-01-01T00:00:00.000Z'],
                },
              },
            }],
          },
        },
      };

      const [patrolWithTracksData] = selectPatrolsWithTracksData(state);

      expect(patrolWithTracksData.trackData)
        .toBe(selectPatrolMapTrackData(state, state.data.patrolStore.patrol123).trackData);
    });

    test('keeps its identity when nothing the patrols draw has changed', () => {
      state.view.patrolTrackState.visible = ['patrol123'];
      state.data.patrolStore = {
        patrol123: {
          id: 'patrol123',
          state: 'done',
          patrol_segments: [{
            leader: { id: 'subject123' },
            time_range: { end_time: '2020-01-09T00:00:00.000Z', start_time: '2020-01-01T00:00:00.000Z' },
          }],
        },
      };

      const patrolsWithTracksData = selectPatrolsWithTracksData(state);

      expect(selectPatrolsWithTracksData({ ...state, data: { ...state.data, eventStore: {} } }))
        .toBe(patrolsWithTracksData);
    });
  });

  describe('selectSubjectTracksWithPatrolTrackShownFlag', () => {
    beforeAll(() => {
      jest.useFakeTimers().setSystemTime(new Date('2020-01-15'));
    });

    test('gets the patrols that have their tracks pinned or visible', () => {
      state.view.subjectTrackState.pinned = ['subject123'];
      state.view.subjectTrackState.visible = ['subject456'];
      state.view.patrolTrackState.pinned = ['patrol123'];
      state.view.patrolTrackState.visible = ['patrol456'];
      state.data.patrolStore = {
        patrol123: {
          patrol_segments: [
            {
              leader: {
                id: 'subject123',
              },
              time_range: {
                end_time: '2020-01-10T00:00:00.000Z',
                start_time: '2020-01-01T00:00:00.000Z',
              },
            },
          ],
        },
        patrol456: {
          patrol_segments: [
            {
              leader: {
                id: 'subject456',
              },
              time_range: {
                end_time: '2020-01-20T00:00:00.000Z',
                start_time: '2020-01-10T00:00:00.000Z',
              },
            },
          ],
        },
      };
      state.data.tracks = {
        subject123: {
          fetchedDateRange: {
            since: '2020-01-01T00:00:00.000Z',
          },
          points: {
            features: [],
          },
          track: {
            features: [
              {
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [0, 0],
                    [0, 1],
                    [0, 2],
                  ],
                },
                properties: {
                  id: 'subject123',
                  coordinateProperties: {
                    times: [
                      '2020-01-01T00:00:00.000Z',
                      '2020-01-03T00:00:00.000Z',
                      '2020-01-05T00:00:00.000Z',
                    ],
                  },
                },
              },
            ],
          },
        },
        subject456: {
          fetchedDateRange: {
            since: '2020-01-01T00:00:00.000Z',
          },
          points: {
            features: [],
          },
          track: {
            features: [
              {
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [0, 0],
                    [1, 0],
                    [2, 0],
                  ],
                },
                properties: {
                  id: 'subject456',
                  coordinateProperties: {
                    times: [
                      '2020-01-11T00:00:00.000Z',
                      '2020-01-13T00:00:00.000Z',
                      '2020-01-15T00:00:00.000Z',
                    ],
                  },
                },
              },
            ],
          },
        },
      };
      expect(selectSubjectTracksWithPatrolTrackShownFlag(state)).toEqual([
        {
          fetchedDateRange: { since: '2020-01-01T00:00:00.000Z' },
          indices: { from: 2 },
          patrolTrackShown: true,
          points: { features: [] },
          track: {
            features: [
              {
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [0, 0],
                    [0, 1],
                    [0, 2],
                  ],
                },
                properties: {
                  coordinateProperties: {
                    times: [
                      '2020-01-01T00:00:00.000Z',
                      '2020-01-03T00:00:00.000Z',
                      '2020-01-05T00:00:00.000Z',
                    ],
                  },
                  id: 'subject123',
                },
              },
            ],
          },
        },
        {
          fetchedDateRange: { since: '2020-01-01T00:00:00.000Z' },
          indices: { from: 2 },
          patrolTrackShown: true,
          points: { features: [] },
          track: {
            features: [
              {
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [0, 0],
                    [1, 0],
                    [2, 0],
                  ],
                },
                properties: {
                  coordinateProperties: {
                    times: [
                      '2020-01-11T00:00:00.000Z',
                      '2020-01-13T00:00:00.000Z',
                      '2020-01-15T00:00:00.000Z',
                    ],
                  },
                  id: 'subject456',
                },
              },
            ],
          },
        },
      ]);
    });

    test('flags a subject as a team lead when it leads a leg other than the first', () => {
      state.view.subjectTrackState.pinned = ['subject789'];
      state.view.patrolTrackState.pinned = ['patrol789'];
      state.data.patrolStore = {
        patrol789: {
          state: 'done',
          patrol_segments: [
            {
              leader: {
                id: 'subjectOther',
              },
              time_range: {
                end_time: '2020-01-05T00:00:00.000Z',
                start_time: '2020-01-01T00:00:00.000Z',
              },
            },
            {
              leader: {
                id: 'subject789',
              },
              time_range: {
                end_time: '2020-01-20T00:00:00.000Z',
                start_time: '2020-01-10T00:00:00.000Z',
              },
            },
          ],
        },
      };
      state.data.tracks = {
        subject789: {
          fetchedDateRange: {
            since: '2020-01-01T00:00:00.000Z',
          },
          points: {
            features: [],
          },
          track: {
            features: [
              {
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [0, 0],
                    [3, 0],
                    [6, 0],
                  ],
                },
                properties: {
                  id: 'subject789',
                  coordinateProperties: {
                    times: [
                      '2020-01-11T00:00:00.000Z',
                      '2020-01-13T00:00:00.000Z',
                      '2020-01-15T00:00:00.000Z',
                    ],
                  },
                },
              },
            ],
          },
        },
      };

      const [subjectTracks] = selectSubjectTracksWithPatrolTrackShownFlag(state);

      expect(subjectTracks.patrolTrackShown).toBe(true);
    });
  });
});
