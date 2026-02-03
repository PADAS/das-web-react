import { TRACK_LENGTH_ORIGINS } from '../../ducks/tracks';

import {
  selectPatrolData,
  selectPatrolLeadersWithLastPosition,
  selectPatrolsWithTracks,
  selectPatrolsWithTracksData,
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

  describe('selectPatrolData', () => {
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
      expect(selectPatrolData(state, patrol)).toEqual({
        leader: { id: 'subject123' },
        patrol: {
          patrol_segments: [
            {
              leader: { id: 'subject123' },
              time_range: {
                end_time: '2020-01-15T00:00:00.000Z',
                start_time: '2020-01-01T00:00:00.000Z',
              },
            },
          ],
        },
        trackData: {
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
      });
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
        },
        {
          leader: { id: 'subject123' },
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
  });
});
