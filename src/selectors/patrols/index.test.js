import { TRACK_LENGTH_ORIGINS } from '../../ducks/tracks';

import {
  selectPatrolLeadersWithLastPosition,
  selectPatrolsWithTracks,
  selectPatrolsWithTracksData,
  selectPatrolTrackData,
  selectPatrolTrackedSubjects,
  selectSubjectTracksWithPatrolTrackShownFlag,
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
        patrolLeaderSchema: {},
        patrolStore: {},
        subjectStore: {},
        tracks: {},
      },
      view: {
        patrolTrackState: {
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
      expect(selectPatrolTrackData(state, patrol)).toEqual({
        leader: { id: 'subject123' },
        legsTrackData: [
          {
            fetchedDateRange: { since: '2020-01-01T00:00:00.000Z' },
            indices: { from: 4, until: 1 },
            points: { features: [] },
            track: {
              features: [
                {
                  geometry: {
                    coordinates: [
                      [0, 1],
                      [0, 2],
                      [0, 3],
                      [0, 4],
                    ],
                  },
                  properties: {
                    coordinateProperties: {
                      times: [
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
        ],
        trackData: {
          points: { type: 'FeatureCollection', features: [] },
          track: {
            type: 'FeatureCollection',
            features: [
              {
                geometry: {
                  coordinates: [
                    [0, 1],
                    [0, 2],
                    [0, 3],
                    [0, 4],
                  ],
                },
                properties: {
                  coordinateProperties: {
                    times: [
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
        leader: { id: 'subject222' },
        legsTrackData: [null, null],
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
                geometry: { coordinates: [[9, 9], [9, 10]] },
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

      expect(selectPatrolTrackData(state, patrol)).toEqual({
        leader: { id: 'subjectB' },
        legsTrackData: [
          null,
          {
            fetchedDateRange: { since: '2020-01-01T00:00:00.000Z' },
            indices: { from: 4, until: 1 },
            points: { features: [] },
            track: {
              features: [
                {
                  geometry: {
                    coordinates: [
                      [0, 1],
                      [0, 2],
                      [0, 3],
                      [0, 4],
                    ],
                  },
                  properties: {
                    coordinateProperties: {
                      times: [
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
        ],
        trackData: {
          points: { type: 'FeatureCollection', features: [] },
          track: {
            type: 'FeatureCollection',
            features: [
              {
                geometry: {
                  coordinates: [
                    [0, 1],
                    [0, 2],
                    [0, 3],
                    [0, 4],
                  ],
                },
                properties: {
                  coordinateProperties: {
                    times: [
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
      });
    });

    test('combines each leg\'s own track into the overall track, most recent leg first', () => {
      state.data.tracks = {
        subjectEarly: {
          fetchedDateRange: { since: '2020-01-01T00:00:00.000Z' },
          points: { features: [] },
          track: {
            features: [
              {
                geometry: {
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

      const { legsTrackData, trackData } = selectPatrolTrackData(state, patrol);

      expect(legsTrackData.map(({ track }) => track.features[0].geometry.coordinates)).toEqual([
        [[0, 1], [0, 2], [0, 3], [0, 4]],
        [[1, 1], [1, 2], [1, 3], [1, 4]],
      ]);
      expect(trackData.track.features.map(({ geometry }) => geometry.coordinates)).toEqual([
        [[1, 1], [1, 2], [1, 3], [1, 4]],
        [[0, 1], [0, 2], [0, 3], [0, 4]],
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

      expect(startStopGeometries.points.start_location.geometry.coordinates).toEqual([1, 1]);
      expect(startStopGeometries.points.end_location.geometry.coordinates).toEqual([2.2, 2.2]);
    });

    test('does not compute any track or geometry data when the patrol state does not allow displaying tracks', () => {
      state.data.tracks = {
        subject123: {
          fetchedDateRange: { since: '2020-01-01T00:00:00.000Z' },
          points: { features: [] },
          track: {
            features: [
              {
                geometry: { coordinates: [[0, 0], [0, 1]] },
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
        leader: { id: 'subject123' },
        legsTrackData: [],
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

      expect(startStopGeometries.points.start_location.geometry.coordinates).toEqual([1, 1]);
      expect(startStopGeometries.points.end_location.geometry.coordinates).toEqual([9, 9]);
    });

    test('does not recompute the trimmed track when an unrelated subject\'s track updates', () => {
      const patrolLeaderTrack = {
        fetchedDateRange: { since: '2020-01-01T00:00:00.000Z' },
        points: { features: [] },
        track: {
          features: [{
            geometry: { coordinates: [[0, 0], [0, 1]] },
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

    const twoLeggedPatrol = {
      patrol_segments: [
        { leader: RANGER, time_range: FIRST_LEG_TIME_RANGE },
        { leader: DOG, time_range: SECOND_LEG_TIME_RANGE },
      ],
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

    test('lists the subject tracked by every leg with the distance it covered, the patrol leader first', () => {
      const trackedSubjects = selectPatrolTrackedSubjects(state, twoLeggedPatrol);

      expect(trackedSubjects.map(({ isPatrolLeader, subject }) => [subject.id, isPatrolLeader])).toEqual([
        [DOG.id, true],
        [RANGER.id, false],
      ]);
      trackedSubjects.forEach(({ distance }) => expect(distance).toBeCloseTo(ONE_DEGREE_IN_KILOMETERS, 1));
    });

    test('adds up the distance a subject covered across every leg it took part in', () => {
      const singleSubjectPatrol = {
        patrol_segments: [
          { leader: RANGER, time_range: FIRST_LEG_TIME_RANGE },
          { leader: RANGER, time_range: SECOND_LEG_TIME_RANGE },
        ],
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

    test('counts only the stretch of the track that falls within the leg time range', () => {
      const patrolWithinALongerTrack = {
        patrol_segments: [{ leader: RANGER, time_range: FIRST_LEG_TIME_RANGE }],
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

    test('counts no distance for a subject whose track is not loaded', () => {
      state.data.tracks = {};

      expect(selectPatrolTrackedSubjects(state, twoLeggedPatrol).map(({ distance }) => distance)).toEqual([0, 0]);
    });

    test('counts no distance for a leg without a start time', () => {
      const patrolWithoutLegStartTime = {
        patrol_segments: [{ leader: RANGER, time_range: { end_time: FIRST_LEG_TIME_RANGE.end_time } }],
      };

      expect(selectPatrolTrackedSubjects(state, patrolWithoutLegStartTime)[0].distance).toBe(0);
    });

    test('counts no distance for a leg whose time range falls outside the fetched track', () => {
      const patrolOutsideTheFetchedTrack = {
        patrol_segments: [{
          leader: RANGER,
          time_range: { end_time: '2019-12-05T00:00:00.000Z', start_time: '2019-12-01T00:00:00.000Z' },
        }],
      };

      expect(selectPatrolTrackedSubjects(state, patrolOutsideTheFetchedTrack)[0].distance).toBe(0);
    });

    test('returns an empty list for a patrol whose legs have no leader', () => {
      const patrolWithoutLeaders = { patrol_segments: [{ leader: null, time_range: FIRST_LEG_TIME_RANGE }] };

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
  });

  describe('selectPatrolLeadersWithLastPosition', () => {
    test('gets the patrol leaders and their last positions', () => {
      state.data.patrolLeaderSchema = {
        trackedbySchema: {
          properties: {
            leader: {
              enum_ext: [
                {
                  value: {
                    id: 'subject123',
                    last_position: {},
                    last_position_status: {},
                  },
                },
                {
                  value: {
                    id: 'subject456',
                  },
                },
              ],
            },
          },
        },
      };
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
      expect(selectPatrolsWithTracksData(state)).toEqual([
        {
          leader: { id: 'subject456' },
          legsTrackData: [
            {
              fetchedDateRange: { since: '2020-01-01T00:00:00.000Z' },
              indices: { from: 2, until: 1 },
              points: { features: [] },
              track: {
                features: [
                  {
                    geometry: {
                      coordinates: [
                        [1, 0],
                        [2, 0],
                      ],
                    },
                    properties: {
                      coordinateProperties: {
                        times: [
                          '2020-01-13T00:00:00.000Z',
                          '2020-01-15T00:00:00.000Z',
                        ],
                      },
                    },
                  },
                ],
              },
            },
          ],
          patrol: {
            patrol_segments: [
              {
                leader: { id: 'subject456' },
                time_range: {
                  end_time: '2020-01-20T00:00:00.000Z',
                  start_time: '2020-01-10T00:00:00.000Z',
                },
              },
            ],
          },
          trackData: {
            points: { type: 'FeatureCollection', features: [] },
            track: {
              type: 'FeatureCollection',
              features: [
                {
                  geometry: {
                    coordinates: [
                      [1, 0],
                      [2, 0],
                    ],
                  },
                  properties: {
                    coordinateProperties: {
                      times: [
                        '2020-01-13T00:00:00.000Z',
                        '2020-01-15T00:00:00.000Z',
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
        {
          leader: { id: 'subject123' },
          legsTrackData: [
            {
              fetchedDateRange: { since: '2020-01-01T00:00:00.000Z' },
              indices: { from: 2, until: 1 },
              points: { features: [] },
              track: {
                features: [
                  {
                    geometry: {
                      coordinates: [
                        [0, 1],
                        [0, 2],
                      ],
                    },
                    properties: {
                      coordinateProperties: {
                        times: [
                          '2020-01-03T00:00:00.000Z',
                          '2020-01-05T00:00:00.000Z',
                        ],
                      },
                    },
                  },
                ],
              },
            },
          ],
          patrol: {
            patrol_segments: [
              {
                leader: { id: 'subject123' },
                time_range: {
                  end_time: '2020-01-10T00:00:00.000Z',
                  start_time: '2020-01-01T00:00:00.000Z',
                },
              },
            ],
          },
          trackData: {
            points: { type: 'FeatureCollection', features: [] },
            track: {
              type: 'FeatureCollection',
              features: [
                {
                  geometry: {
                    coordinates: [
                      [0, 1],
                      [0, 2],
                    ],
                  },
                  properties: {
                    coordinateProperties: {
                      times: [
                        '2020-01-03T00:00:00.000Z',
                        '2020-01-05T00:00:00.000Z',
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      ]);
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

    test('flags a subject as a patrol leader when it leads a leg other than the first', () => {
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
