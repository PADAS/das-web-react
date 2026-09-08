import axios, { CancelToken, isCancel } from 'axios';

import { API_URL } from '../../constants';
import { calcPatrolFilterForRequest } from '../../utils/patrol-filter';
import globallyResettableReducer from '../../reducers/global-resettable';

export const PATROLS_API_URL = `${API_URL}activity/patrols/`;
export const PATROL_CONFIG_API_URL = `${PATROLS_API_URL}config/default/resolved/`;
export const PATROL_LEADERS_API_URL = `${PATROLS_API_URL}trackedby`;

const PATROLS_FEED_PAGE_SIZE = 200;

// Actions
export const ADD_PATROL_NOTE_SUCCESS = 'PATROLS.ADD_PATROL_NOTE_SUCCESS';

export const CREATE_PATROL_SUCCESS = 'PATROLS.CREATE_PATROL_SUCCESS';

export const FETCH_PATROLS_FEED_SUCCESS = 'PATROLS.FETCH_PATROLS_FEED_SUCCESS';

export const FETCH_PATROL_TEAM_AND_TRACKING_OPTIONS_SUCCESS
  = 'PATROLS.FETCH_PATROL_TEAM_AND_TRACKING_OPTIONS_SUCCESS';

export const UPDATE_PATROL_SUCCESS = 'PATROLS.UPDATE_PATROL_SUCCESS';
export const UPDATE_PATROL_ERROR = 'PATROLS.UPDATE_PATROL_ERROR';

export const UPDATE_PATROL_STORE = 'PATROLS.UPDATE_PATROL_STORE';
export const UPDATE_PATROL_TRACK_STATE = 'PATROLS.UPDATE_PATROL_TRACK_STATE';

export const CREATE_PATROL_REALTIME = 'PATROLS.CREATE_PATROL_REALTIME';
export const UPDATE_PATROL_REALTIME = 'PATROLS.UPDATE_PATROL_REALTIME';

export const ADD_PATROL_TO_FEED = 'PATROLS.ADD_PATROL_TO_FEED';
export const REMOVE_PATROL_FROM_FEED = 'PATROLS.REMOVE_PATROL_FROM_FEED';
export const DELETE_PATROL_BY_ID = 'PATROLS.DELETE_PATROL_BY_ID';

// Action creators
const patrolFeedMembership = (patrolId, matchesCurrentFilter) => ({
  payload: patrolId,
  type: matchesCurrentFilter ? ADD_PATROL_TO_FEED : REMOVE_PATROL_FROM_FEED,
});

export const socketCreatePatrol = ({ matches_current_filter, patrol_data }) => (dispatch) => {
  dispatch({
    payload: patrol_data,
    type: CREATE_PATROL_REALTIME,
  });

  dispatch(patrolFeedMembership(patrol_data.id, matches_current_filter));
};

export const socketUpdatePatrol = ({ matches_current_filter, patrol_data }) => (dispatch) => {
  dispatch({
    payload: patrol_data,
    type: UPDATE_PATROL_REALTIME,
  });

  dispatch(patrolFeedMembership(patrol_data.id, matches_current_filter));
};

export const socketDeletePatrol = ({ patrol_id }) => ({
  payload: patrol_id,
  type: DELETE_PATROL_BY_ID,
});

export const updatePatrolStore = (patrols) => ({
  payload: patrols,
  type: UPDATE_PATROL_STORE,
});

export const updatePatrolTrackState = (payload) => ({
  payload,
  type: UPDATE_PATROL_TRACK_STATE,
});

export const fetchPatrol = (id) => (dispatch) => axios.get(`${PATROLS_API_URL}${id}`)
  .then((response) => {
    dispatch({
      payload: response.data.data,
      type: UPDATE_PATROL_SUCCESS,
    });

    return response;
  })
  .catch((error) => {
    console.warn('error fetching patrol', error);

    throw error;
  });

export const fetchPatrolsFeed = () => (dispatch) => {
  const cancelToken = CancelToken.source();

  const request = axios.get(
    `${PATROLS_API_URL}?${calcPatrolFilterForRequest({ params: { page_size: PATROLS_FEED_PAGE_SIZE } })}`,
    { cancelToken: cancelToken.token }
  )
    .then((response) => {
      // The store is filled first so every id the feed lists can be read back
      // from it.
      dispatch(updatePatrolStore(response.data.data));

      dispatch({
        payload: response.data.data.results.map((patrol) => patrol.id),
        type: FETCH_PATROLS_FEED_SUCCESS,
      });
    })
    .catch((error) => {
      if (!isCancel(error)) {
        console.warn('error fetching patrols', error);
      }
    });

  return { cancelToken, request };
};

export const fetchPatrolTeamAndTrackingOptions = () => async (dispatch) => {
  // Each endpoint backs lists of its own, so one of them answering is worth
  // keeping whatever the other one does.
  const [configResult, leadersResult] = await Promise.allSettled([
    axios.get(PATROL_CONFIG_API_URL),
    axios.get(PATROL_LEADERS_API_URL),
  ]);

  if (configResult.status === 'rejected') {
    console.warn('error fetching the patrol config', configResult.reason);
  }
  if (leadersResult.status === 'rejected') {
    console.warn('error fetching the patrol leaders', leadersResult.reason);
  }

  const config = configResult.value?.data?.data;
  const leadersSchema = leadersResult.value?.data?.data;

  const options = {
    assets: config?.assets ?? [],
    // The leaders endpoint answers with a fragment of the patrol schema
    // instead of a plain list.
    leaders: leadersSchema?.properties?.leader?.enum_ext?.map(({ value }) => value) ?? [],
    teamMembers: config?.members ?? [],
    teams: config?.teams ?? [],
  };

  dispatch({
    payload: options,
    type: FETCH_PATROL_TEAM_AND_TRACKING_OPTIONS_SUCCESS,
  });

  return options;
};

export const createPatrol = (patrol) => (dispatch) => axios.post(PATROLS_API_URL, patrol)
  .then((response) => {
    dispatch({
      payload: response.data.data,
      type: CREATE_PATROL_SUCCESS,
    });

    return response;
  });

export const updatePatrol = (patrol) => (dispatch) => axios.patch(`${PATROLS_API_URL}${patrol.id}`, patrol)
  .then((response) => {
    dispatch({
      payload: response.data.data,
      type: UPDATE_PATROL_SUCCESS,
    });

    return response;
  })
  .catch((error) => {
    dispatch({
      payload: error,
      type: UPDATE_PATROL_ERROR,
    });

    return Promise.reject(error);
  });

export const addNoteToPatrol = (patrolId, note) => (dispatch) =>
  axios.post(`${PATROLS_API_URL}${patrolId}/notes/`, note)
    .then((response) => {
      dispatch({
        payload: response.data.data,
        type: ADD_PATROL_NOTE_SUCCESS,
      });

      return response;
    });

export const uploadPatrolFile = (patrolId, file) => {
  const form = new FormData();
  form.append('filecontent.file', file);

  return axios.post(`${PATROLS_API_URL}${patrolId}/files/`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const togglePatrolTrackState = (id) => (dispatch, getState) => {
  const { view: { patrolTrackState: { pinned, visible } } } = getState();

  if (pinned.includes(id)) {
    return dispatch(updatePatrolTrackState({
      pinned: pinned.filter((item) => item !== id),
      visible: visible.filter((item) => item !== id),
    }));
  }

  if (visible.includes(id)) {
    return dispatch(updatePatrolTrackState({
      pinned: [...pinned, id],
      visible: visible.filter((item) => item !== id),
    }));
  }

  return dispatch(updatePatrolTrackState({ visible: [...visible, id] }));
};

// Reducer

// Every consumer takes the first leg for the earliest and the last for the most
// recent, and the API promises no order.
const patrolSegmentStartTime = (patrolSegment) =>
  patrolSegment.time_range?.start_time ?? patrolSegment.scheduled_start ?? null;

const withSortedPatrolSegments = (patrol) => {
  if (!Array.isArray(patrol.patrol_segments) || patrol.patrol_segments.length < 2) {
    return patrol;
  }

  const sortedPatrolSegments = [...patrol.patrol_segments].sort((a, b) => {
    const aStartTime = patrolSegmentStartTime(a);
    const bStartTime = patrolSegmentStartTime(b);

    // A leg that has no start of its own goes last, in the order it came in.
    if (!aStartTime || !bStartTime) {
      return (aStartTime ? 0 : 1) - (bStartTime ? 0 : 1);
    }

    return new Date(aStartTime).getTime() - new Date(bStartTime).getTime();
  });

  return sortedPatrolSegments.every((patrolSegment, index) => patrolSegment === patrol.patrol_segments[index])
    ? patrol
    : { ...patrol, patrol_segments: sortedPatrolSegments };
};

export const INITIAL_STORE_STATE = {};

export const patrolStoreReducer = globallyResettableReducer((state, { type, payload }) => {
  switch (type) {
  case UPDATE_PATROL_STORE:
    return payload.results.reduce((accumulator, patrol) => {
      accumulator[patrol.id] = withSortedPatrolSegments({ ...state[patrol.id], ...patrol });

      return accumulator;
    }, { ...state });

  case CREATE_PATROL_REALTIME:
  case CREATE_PATROL_SUCCESS:
  case UPDATE_PATROL_REALTIME:
  case UPDATE_PATROL_SUCCESS:
    return {
      ...state,
      [payload.id]: withSortedPatrolSegments({
        ...state[payload.id],
        ...payload,
      }),
    };

  case DELETE_PATROL_BY_ID: {
    const newState = { ...state };
    delete newState[payload];

    return newState;
  }

  default:
    return state;
  }
}, INITIAL_STORE_STATE);

export const INITIAL_PATROLS_FEED_STATE = [];

export const patrolsFeedReducer = globallyResettableReducer((state, { type, payload }) => {
  switch (type) {
  case FETCH_PATROLS_FEED_SUCCESS:
    return payload;

  case ADD_PATROL_TO_FEED:
    return state.includes(payload) ? state : [payload, ...state];

  case DELETE_PATROL_BY_ID:
  case REMOVE_PATROL_FROM_FEED:
    return state.includes(payload) ? state.filter((patrolId) => patrolId !== payload) : state;

  default:
    return state;
  }
}, INITIAL_PATROLS_FEED_STATE);

export const INITIAL_PATROL_TEAM_AND_TRACKING_OPTIONS_STATE = {
  assets: [],
  leaders: [],
  teamMembers: [],
  teams: [],
};

export const patrolTeamAndTrackingOptionsReducer = globallyResettableReducer((state, { type, payload }) => {
  switch (type) {
  case FETCH_PATROL_TEAM_AND_TRACKING_OPTIONS_SUCCESS:
    return payload;

  default:
    return state;
  }
}, INITIAL_PATROL_TEAM_AND_TRACKING_OPTIONS_STATE);

export const INITIAL_PATROL_TRACKS_STATE = {
  pinned: [],
  visible: [],
};

export const patrolTracksReducer = globallyResettableReducer((state, { type, payload }) => {
  switch (type) {
  case UPDATE_PATROL_TRACK_STATE:
    return {
      ...state,
      ...payload,
    };

  default:
    return state;
  }
}, INITIAL_PATROL_TRACKS_STATE);
