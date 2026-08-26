import axios, { CancelToken, isCancel } from 'axios';

import { API_URL } from '../constants';
import { calcPatrolFilterForRequest } from '../utils/patrol-filter';
import globallyResettableReducer from '../reducers/global-resettable';

export const PATROLS_API_URL = `${API_URL}activity/patrols/`;

// actions
export const ADD_PATROL_NOTE_SUCCESS = 'ADD_PATROL_NOTE_SUCCESS';

export const CREATE_PATROL_SUCCESS = 'CREATE_PATROL_SUCCESS';

export const FETCH_PATROLS_FEED_SUCCESS = 'FETCH_PATROLS_FEED_SUCCESS';

export const UPDATE_PATROL_SUCCESS = 'UPDATE_PATROL_SUCCESS';
export const UPDATE_PATROL_ERROR = 'UPDATE_PATROL_ERROR';

export const UPDATE_PATROL_STORE = 'UPDATE_PATROL_STORE';
export const UPDATE_PATROL_TRACK_STATE = 'UPDATE_PATROL_TRACK_STATE';

export const CREATE_PATROL_REALTIME = 'CREATE_PATROL_REALTIME';
export const UPDATE_PATROL_REALTIME = 'UPDATE_PATROL_REALTIME';

// A patrol that stops matching the filter only leaves the feed, it stays in the store so an open
// one does not vanish under the user. Only a server-side deletion takes it out of the store.
export const ADD_PATROL_TO_FEED = 'ADD_PATROL_TO_FEED';
export const REMOVE_PATROL_FROM_FEED = 'REMOVE_PATROL_FROM_FEED';
export const DELETE_PATROL_BY_ID = 'DELETE_PATROL_BY_ID';

// socket action creators

const patrolFeedMembership = (patrolId, matchesCurrentFilter) => ({
  payload: patrolId,
  type: matchesCurrentFilter ? ADD_PATROL_TO_FEED : REMOVE_PATROL_FROM_FEED,
});

export const socketCreatePatrol = ({ patrol_data, matches_current_filter }) => (dispatch) => {
  dispatch({
    payload: patrol_data,
    type: CREATE_PATROL_REALTIME,
  });

  dispatch(patrolFeedMembership(patrol_data.id, matches_current_filter));
};

export const socketUpdatePatrol = ({ patrol_data, matches_current_filter }) => (dispatch) => {
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

// action creators
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
    `${PATROLS_API_URL}?${calcPatrolFilterForRequest({ params: { page_size: 200 } })}`,
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

export const addNoteToPatrol = (patrol_id, note) => (dispatch) =>
  axios.post(`${PATROLS_API_URL}${patrol_id}/notes/`, note)
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

// reducers
export const INITIAL_STORE_STATE = {};

export const patrolStoreReducer = globallyResettableReducer((state, { type, payload }) => {
  if (type === UPDATE_PATROL_STORE) {
    return payload.results.reduce((accumulator, patrol) => {
      accumulator[patrol.id] = { ...state[patrol.id], ...patrol };

      return accumulator;
    }, { ...state });
  }

  if (type === CREATE_PATROL_SUCCESS
    || type === UPDATE_PATROL_SUCCESS
    || type === CREATE_PATROL_REALTIME
    || type === UPDATE_PATROL_REALTIME) {
    return {
      ...state,
      [payload.id]: {
        ...state[payload.id],
        ...payload,
      },
    };
  }

  if (type === DELETE_PATROL_BY_ID) {
    const newState = { ...state };
    delete newState[payload];

    return newState;
  }

  return state;
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

export const INITIAL_PATROL_TRACKS_STATE = {
  pinned: [],
  visible: [],
};

export const patrolTracksReducer = globallyResettableReducer((state, { type, payload }) => {
  if (type === UPDATE_PATROL_TRACK_STATE) {
    return {
      ...state,
      ...payload,
    };
  }

  return state;
}, INITIAL_PATROL_TRACKS_STATE);
