import axios, { CancelToken, isCancel } from 'axios';

import { API_URL } from '../constants';
import globallyResettableReducer from '../reducers/global-resettable';

/**
 * Batch replay time series API (das: SubjectPositionsReplayView).
 * GET observations/subject-movement-timeline/?subject_ids=&since=&until=
 * Response: subject UUID → [{ t, lon, lat }, ...] (newest first), plus reserved keys:
 *   unknown_subject_ids, truncated_subject_ids
 */
export const SUBJECT_POSITIONS_API_URL = `${API_URL}observations/subject-movement-timeline/`;

export const TIMELINE_META_KEYS = new Set(['unknown_subject_ids', 'truncated_subject_ids']);

export const parseSubjectMovementTimelineResponse = (data) => {
  const raw = data && typeof data === 'object' ? data : {};
  const unknownSubjectIds = Array.isArray(raw.unknown_subject_ids)
    ? raw.unknown_subject_ids
    : [];
  const truncatedSubjectIds = Array.isArray(raw.truncated_subject_ids)
    ? raw.truncated_subject_ids
    : [];
  const bySubject = {};
  Object.keys(raw).forEach((k) => {
    if (TIMELINE_META_KEYS.has(k)) return;
    const v = raw[k];
    if (Array.isArray(v)) {
      bySubject[k] = v;
    }
  });
  return { bySubject, unknownSubjectIds, truncatedSubjectIds };
};

export const FETCH_SUBJECT_POSITION_TIME_SERIES_SUCCESS = 'FETCH_SUBJECT_POSITION_TIME_SERIES_SUCCESS';
export const FETCH_SUBJECT_POSITION_TIME_SERIES_ERROR = 'FETCH_SUBJECT_POSITION_TIME_SERIES_ERROR';

const fetchSubjectPositionTimeSeriesSuccess = (payload, requestedSubjectIds) => ({
  type: FETCH_SUBJECT_POSITION_TIME_SERIES_SUCCESS,
  payload,
  meta: { requestedSubjectIds },
});

const fetchSubjectPositionTimeSeriesError = (error) => ({
  type: FETCH_SUBJECT_POSITION_TIME_SERIES_ERROR,
  payload: error,
});

/**
 * Fetch position time series for the given subject IDs over [since, until].
 * Replaces stored timeline for this fetch (partial success: unknown IDs omitted from bySubject).
 */
export const fetchSubjectPositionTimeSeries = (since, until, subjectIds, cancelToken = CancelToken.source()) => {
  if (!subjectIds?.length || !since || !until) {
    return () => {};
  }
  const sinceISO = typeof since === 'string' ? since : new Date(since).toISOString();
  const untilISO = typeof until === 'string' ? until : new Date(until).toISOString();
  return async (dispatch) => {
    try {
      const { data } = await axios.get(SUBJECT_POSITIONS_API_URL, {
        params: {
          subject_ids: subjectIds.join(','),
          since: sinceISO,
          until: untilISO,
        },
        cancelToken: cancelToken.token,
      });
      dispatch(fetchSubjectPositionTimeSeriesSuccess(data || {}, [...subjectIds]));
    } catch (error) {
      if (!isCancel(error)) {
        console.warn('error fetching subject position time series', error);
        dispatch(fetchSubjectPositionTimeSeriesError(error));
      }
    }
  };
};

const INITIAL_STATE = {
  bySubject: {},
  unknownSubjectIds: [],
  truncatedSubjectIds: [],
};

const subjectPositionTimeSeriesReducer = (state = INITIAL_STATE, action = {}) => {
  switch (action.type) {
  case FETCH_SUBJECT_POSITION_TIME_SERIES_SUCCESS: {
    const { bySubject: incoming, unknownSubjectIds, truncatedSubjectIds } = parseSubjectMovementTimelineResponse(
      action.payload,
    );
    if (truncatedSubjectIds.length && process.env.NODE_ENV !== 'production') {
      console.warn(
        '[subject-movement-timeline] Truncated subjects (raise limit or narrow range):',
        truncatedSubjectIds,
      );
    }
    const requested = action.meta?.requestedSubjectIds || [];
    const nextBySubject = { ...state.bySubject };
    requested.forEach((id) => {
      if (Object.prototype.hasOwnProperty.call(incoming, id)) {
        nextBySubject[id] = incoming[id];
      } else {
        delete nextBySubject[id];
      }
    });
    return {
      ...state,
      bySubject: nextBySubject,
      unknownSubjectIds,
      truncatedSubjectIds,
    };
  }
  case FETCH_SUBJECT_POSITION_TIME_SERIES_ERROR:
    return state;
  default:
    return state;
  }
};

export default globallyResettableReducer(subjectPositionTimeSeriesReducer, INITIAL_STATE);
