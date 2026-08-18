import axios, { CancelToken } from 'axios';
import merge from 'lodash/merge';

import { API_URL } from '../constants';
import { calcPatrolFilterForRequest } from '../utils/patrol-filter';
import globallyResettableReducer from '../reducers/global-resettable';

export const PATROLS_API_URL = `${API_URL}activity/patrols/`;

const UPDATE_PATROL_STORE = 'UPDATE_PATROL_STORE';
const FETCH_PATROLS_ERROR = 'FETCH_PATROLS_ERROR';

const CREATE_PATROL_SUCCESS = 'CREATE_PATROL_SUCCESS';

const UPDATE_PATROL_ERROR = 'UPDATE_PATROL_ERROR';

const ADD_PATROL_NOTE_SUCCESS = 'ADD_PATROL_NOTE_SUCCESS';

const CLEAR_PATROL_DATA = 'CLEAR_PATROL_DATA';

const REMOVE_PATROL_BY_ID = 'REMOVE_PATROL_BY_ID';

export const UPDATE_PATROL_TRACK_STATE = 'UPDATE_PATROL_TRACK_STATE';

const UPDATE_PATROL_SUCCESS = 'UPDATE_PATROL_SUCCESS';
export const UPDATE_PATROL_REALTIME = 'UPDATE_PATROL_REALTIME';
export const CREATE_PATROL_REALTIME = 'CREATE_PATROL_REALTIME';

// for now, assume that a realtime update of a patrol can
// use the same reducer as the results of the restful updat
export const socketUpdatePatrol = (payload) => (dispatch) => {
  const { patrol_data, matches_current_filter } = payload;
  if (matches_current_filter) {
    dispatch({
      type: UPDATE_PATROL_REALTIME,
      payload: patrol_data,
    });
  } else {
    dispatch({
      type: REMOVE_PATROL_BY_ID,
      payload: patrol_data.id,
    });
  }
};

// likewise, assume that a realtime message to create a patrol
// can use the same reducer
export const socketCreatePatrol = (payload) => (dispatch) => {
  const { patrol_data, matches_current_filter } = payload;
  console.log('patrol_create', patrol_data, matches_current_filter);
  if (matches_current_filter) {
    dispatch({
      type: CREATE_PATROL_REALTIME,
      payload: patrol_data,
    });
  } else {
    dispatch({
      type: REMOVE_PATROL_BY_ID,
      payload: patrol_data.id,
    });
  }
};

export const updatePatrolStore = (patrols) => ({
  type: UPDATE_PATROL_STORE,
  payload: patrols,
});

export const socketDeletePatrol = (payload) => (dispatch) => {
  const { patrol_id, matches_current_filter } = payload;
  if (matches_current_filter) {
    dispatch({
      type: REMOVE_PATROL_BY_ID,
      payload: patrol_id,
    });
  }
};

export const fetchPatrol = id => dispatch => axios.get(`${PATROLS_API_URL}${id}`)
  .then((response) => {
    const patrol = response.data.data;
    dispatch({
      type: UPDATE_PATROL_SUCCESS,
      payload: patrol,
    });
    return response;
  })
  .catch((error) => {
    console.warn('error fetching patrol', error);
    throw error;
  });

export const createPatrol = (patrol) => (dispatch) => {

  return axios.post(PATROLS_API_URL, patrol)
    .then((response) => {
      dispatch({
        type: CREATE_PATROL_SUCCESS,
        payload: response.data.data,
      });
      return response;
    });
/*     .catch((error) => {
      dispatch({
        type: CREATE_PATROL_ERROR,
        payload: error,
      });
      return Promise.reject(error);
    }); */
};

export const updatePatrol = patrol => dispatch => {

  return axios.patch(`${PATROLS_API_URL}${patrol.id}`, patrol)
  /*  .then((response) => {
      patrolResults = response.data.data;
      resp = response;
      return true;
      // return Promise.resolve(validatePatrolAgainstCurrentPatrolFilter(patrolResults));
    })
    .then((matchesPatrolFilter) => {
      if (!matchesPatrolFilter) {
        dispatch({
          type: REMOVE_PATROL_BY_ID,
          payload: patrol.id,
        });
      } else {
        dispatch({
          type: UPDATE_PATROL_SUCCESS,
          payload: patrolResults,
        });
      }
      return resp;
   }); */
    .catch((error) => {
      dispatch({
        type: UPDATE_PATROL_ERROR,
        payload: error,
      });
      return Promise.reject(error);
    });
};

export const updatePatrolTrackState = payload => ({
  type: UPDATE_PATROL_TRACK_STATE, payload,
});

export const togglePatrolTrackState = (id) => (dispatch, getState) => {
  const { view: { patrolTrackState: { pinned, visible } } } = getState();
  if (pinned.includes(id)) {
    return dispatch(updatePatrolTrackState({
      pinned: pinned.filter(item => item !== id),
      visible: visible.filter(item => item !== id),
    }));
  }
  if (visible.includes(id)) {
    return dispatch(updatePatrolTrackState({
      pinned: [...pinned, id],
      visible: visible.filter(item => item !== id),
    }));
  }
  return dispatch(updatePatrolTrackState({
    visible: [...visible, id],
  }));

};
export const addNoteToPatrol = (patrol_id, note) => (dispatch) => {
  return axios.post(`${PATROLS_API_URL}${patrol_id}/notes/`, note)
    .then((response) => {
      dispatch({
        type: ADD_PATROL_NOTE_SUCCESS,
        payload: response.data.data,
      });
      return response;
    });
/*     .catch((error) => {
      dispatch({
        type: ADD_PATROL_NOTE_ERROR,
        payload: error,
      });
      return Promise.reject(error);
    }); */
};

// Not a thunk: the uploaded file only reaches the store through the patrol itself.
export const uploadPatrolFile = (patrolId, file) => {
  const form = new FormData();
  form.append('filecontent.file', file);

  return axios.post(`${PATROLS_API_URL}${patrolId}/files/`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// patrol store 
const INITIAL_STORE_STATE = {};
export const patrolStoreReducer = (state = INITIAL_STORE_STATE, { type, payload }) => {
  if (type === CLEAR_PATROL_DATA) {
    return { ...INITIAL_STORE_STATE };
  }

  if (type === UPDATE_PATROL_STORE) {
    return merge({}, state, payload.results.reduce((accumulator, patrol) => ({
      ...accumulator,
      [patrol.id]: patrol,
    }), {}));
  }


  if (type === UPDATE_PATROL_SUCCESS
    || type === UPDATE_PATROL_REALTIME
    || type ===CREATE_PATROL_REALTIME) {
    return {
      ...state,
      [payload.id]: {
        ...state[payload.id],
        ...payload,
      },
    };
  }

  if (type === REMOVE_PATROL_BY_ID) {
    const newState = { ...state };
    delete newState[payload];

    return newState;
  }
  return state;
};

const INITIAL_PATROL_TRACKS_STATE = {
  pinned: [],
  visible: [],
};

export const patrolTracksReducer = (state = INITIAL_PATROL_TRACKS_STATE, { type, payload }) => {

  if (type === UPDATE_PATROL_TRACK_STATE) {
    return {
      ...state,
      ...payload,
    };
  }

  return state;
};

// Actions
const FETCH_PATROLS_FEED_SUCCESS = 'FETCH_PATROLS_FEED_SUCCESS';

// Action creators
export const fetchPatrolsFeed = () => (dispatch) => {
  const cancelToken = CancelToken.source();

  const request = axios.get(
    `${PATROLS_API_URL}?${calcPatrolFilterForRequest({ params: { page_size: 200 } })}`,
    { cancelToken: cancelToken.token }
  )
    .then((response) => {
      dispatch({ payload: response.data.data.results.map((patrol) => patrol.id), type: FETCH_PATROLS_FEED_SUCCESS });
      dispatch(updatePatrolStore(response.data.data));
    })
    .catch((error) => {
      dispatch({ payload: error, type: FETCH_PATROLS_ERROR });

      console.warn('error fetching patrols', error);
    });

  return { cancelToken, request };
};

// Reducer
export const INITIAL_PATROLS_FEED_STATE = [];

export const patrolsFeedReducer = globallyResettableReducer((state, action) => {
  switch (action.type) {
  case FETCH_PATROLS_FEED_SUCCESS:
    return action.payload;

  case CREATE_PATROL_REALTIME:
    if (!state.includes(action.payload.id)) {
      return [action.payload.id, ...state];
    }
    return state;

  case REMOVE_PATROL_BY_ID:
    return state.filter((patrolId) => patrolId !== action.payload);

  default:
    return state;
  }
}, INITIAL_PATROLS_FEED_STATE);
