import {
  selectTrackTimeEnvelope,
  selectHeatmapSubjectTracksTrimmedToTrackTimeEnvelope,
  selectSubjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod,
} from './';
import { TRACK_LENGTH_ORIGINS } from '../../ducks/tracks';

jest.mock('../../store', () => ({}));

describe('Selectors - Tracks', () => {
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
        patrolStore: {},
        tracks: {},
      },
      view: {
        heatmapSubjectIDs: [],
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
        },
        trackSettings: {
          length: 21,
          origin: TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH,
        },
      },
    };
  });

  describe('selectTrackTimeEnvelope', () => {
    beforeAll(() => {
      jest.useFakeTimers().setSystemTime(new Date('2021-01-01'));
    });

    test('builds the track time envelope from the time slider virtual date', () => {
      state.view.timeSliderState = {
        active: true,
        virtualDate: '2020-06-01T06:00:00.000Z',
      };
      expect(selectTrackTimeEnvelope(state)).toEqual({
        from: new Date('2020-05-11T06:00:00.000Z'),
        until: '2020-06-01T06:00:00.000Z',
      });
    });

    test('builds the track time envelope when the time slider is active without a virtual date', () => {
      state.view.timeSliderState = {
        active: true,
        virtualDate: null,
      };
      expect(selectTrackTimeEnvelope(state)).toEqual({
        from: new Date('2020-12-11T00:00:00.000Z'),
        until: null,
      });
    });

    test('builds the track time envelope when the time slider is inactive', () => {
      expect(selectTrackTimeEnvelope(state)).toEqual({
        from: new Date('2020-12-11T00:00:00.000Z'),
        until: null,
      });
    });

    test('builds the track time envelope if the track length origin is the event filter', () => {
      state.view.trackSettings.origin = TRACK_LENGTH_ORIGINS.EVENT_FILTER;
      expect(selectTrackTimeEnvelope(state)).toEqual({
        from: new Date('2020-01-02T00:00:00.000Z'),
        until: null,
      });
    });
  });

  describe('selectHeatmapSubjectTracksTrimmedToTrackTimeEnvelope', () => {
    beforeAll(() => {
      jest.useFakeTimers().setSystemTime(new Date('2021-01-01'));
    });

    test('builds the subject tracks from the subjects with heatmap active trimmed to the time envelope', () => {
      state.view.heatmapSubjectIDs = ['123'];
      state.data.tracks = {
        123: {
          points: {
            features: [],
          },
          track: {
            features: [{
              geometry: {
                coordinates: [[-23.91673, 70.893701]]
              },
              properties: {
                coordinateProperties: {
                  times: ['2020-12-15T00:00:00.000Z'],
                },
              },
            }],
          },
        },
      };
      expect(selectHeatmapSubjectTracksTrimmedToTrackTimeEnvelope(state))
        .toEqual([{
          indices: {
            from: 0,
          },
          points: {
            features: [],
          },
          track: {
            features: [{
              geometry: {
                coordinates: [[-23.91673, 70.893701]],
              },
              properties: {
                coordinateProperties: {
                  times: ['2020-12-15T00:00:00.000Z'],
                },
              },
            }],
          },
        }]);
    });
  });

  describe('selectSubjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod', () => {
    beforeAll(() => {
      jest.useFakeTimers().setSystemTime(new Date('2021-01-01'));
    });

    test('builds the subject tracks from the subjects with heatmap active trimmed to the time envelope', () => {
      state.view.subjectTrackState.visible = ['123'];
      state.data.tracks = {
        123: {
          points: {
            features: [],
          },
          track: {
            features: [{
              geometry: {
                coordinates: [[-23.91673, 70.893701]]
              },
              properties: {
                coordinateProperties: {
                  times: ['2020-12-15T00:00:00.000Z'],
                },
              },
            }],
          },
        },
      };
      expect(selectSubjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod(state))
        .toEqual([{
          indices: {
            from: 0,
          },
          points: {
            features: [],
          },
          track: {
            features: [{
              geometry: {
                coordinates: [[-23.91673, 70.893701]],
              },
              properties: {
                coordinateProperties: {
                  times: ['2020-12-15T00:00:00.000Z'],
                },
              },
            }],
          },
        }]);
    });
  });
});
