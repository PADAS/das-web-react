import subjectPositionTimeSeriesReducer, {
  FETCH_SUBJECT_POSITION_TIME_SERIES_SUCCESS,
  parseSubjectMovementTimelineResponse,
} from './subject-position-time-series';

describe('subject-position-time-series', () => {
  describe('parseSubjectMovementTimelineResponse', () => {
    test('strips meta keys and keeps subject point arrays', () => {
      const sid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const data = {
        [sid]: [{ t: '2024-03-15T10:00:00.000Z', lon: 1, lat: 2 }],
        unknown_subject_ids: ['deadbeef-dead-beef-dead-beefdeadbeef'],
        truncated_subject_ids: [sid],
        notAnArray: 'skip',
      };
      const out = parseSubjectMovementTimelineResponse(data);
      expect(out.bySubject).toEqual({
        [sid]: [{ t: '2024-03-15T10:00:00.000Z', lon: 1, lat: 2 }],
      });
      expect(out.unknownSubjectIds).toEqual(['deadbeef-dead-beef-dead-beefdeadbeef']);
      expect(out.truncatedSubjectIds).toEqual([sid]);
    });

    test('handles empty or invalid payload', () => {
      expect(parseSubjectMovementTimelineResponse(null)).toEqual({
        bySubject: {},
        unknownSubjectIds: [],
        truncatedSubjectIds: [],
      });
    });
  });

  describe('reducer', () => {
    test('merges bySubject only for requested ids', () => {
      const sidA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      const sidB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
      const state = {
        bySubject: { [sidA]: [{ t: '2020-01-01T00:00:00.000Z', lon: 0, lat: 0 }] },
        unknownSubjectIds: [],
        truncatedSubjectIds: [],
      };
      const action = {
        type: FETCH_SUBJECT_POSITION_TIME_SERIES_SUCCESS,
        payload: {
          [sidB]: [],
          unknown_subject_ids: [],
          truncated_subject_ids: [],
        },
        meta: { requestedSubjectIds: [sidB] },
      };
      const next = subjectPositionTimeSeriesReducer(state, action);
      expect(next.bySubject[sidA]).toEqual([{ t: '2020-01-01T00:00:00.000Z', lon: 0, lat: 0 }]);
      expect(next.bySubject[sidB]).toEqual([]);
    });

    test('removes requested id missing from response body', () => {
      const sid = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
      const state = {
        bySubject: { [sid]: [{ t: '2020-01-01T00:00:00.000Z', lon: 1, lat: 1 }] },
        unknownSubjectIds: [],
        truncatedSubjectIds: [],
      };
      const action = {
        type: FETCH_SUBJECT_POSITION_TIME_SERIES_SUCCESS,
        payload: {
          unknown_subject_ids: [sid],
          truncated_subject_ids: [],
        },
        meta: { requestedSubjectIds: [sid] },
      };
      const next = subjectPositionTimeSeriesReducer(state, action);
      expect(next.bySubject[sid]).toBeUndefined();
    });
  });
});
