import axios from 'axios';
import merge from 'lodash/merge';
import uniq from 'lodash/uniq';

import { API_URL } from '../constants';

import globallyResettableReducer from '../reducers/global-resettable';
import { calcPatrolFilterForRequest, 
  validatePatrolAgainstCurrentPatrolFilter } from '../utils/patrol-filter';

const PATROLS_API_URL = `${API_URL}activity/patrols/`;

const FETCH_PATROLS_SUCCESS = 'FETCH_PATROLS_SUCCESS';
const FETCH_PATROLS_ERROR = 'FETCH_PATROLS_ERROR';

const CREATE_PATROL_SUCCESS = 'CREATE_PATROL_SUCCESS';
// const CREATE_PATROL_ERROR = 'CREATE_PATROL_ERROR';

// const UPDATE_PATROL_ERROR = 'UPDATE_PATROL_ERROR';

const ADD_PATROL_NOTE_SUCCESS = 'ADD_PATROL_NOTE_SUCCESS';

const UPLOAD_PATROL_FILES_START = 'UPLOAD_PATROL_FILES_START';
const UPLOAD_PATROL_FILES_SUCCESS = 'UPLOAD_PATROL_FILES_SUCCESS';
const UPLOAD_PATROL_FILES_ERROR = 'UPLOAD_PATROL_FILES_ERROR';


const CLEAR_PATROL_DATA = 'CLEAR_PATROL_DATA';
const UPDATE_PATROL_STORE = 'UPDATE_PATROL_STORE';

const REMOVE_PATROL_BY_ID = 'REMOVE_PATROL_BY_ID';

const SHOW_PATROL_TRACK = 'SHOW_PATROL_TRACK';
const HIDE_PATROL_TRACK = 'HIDE_PATROL_TRACK';


// for now, assume that a realtime update of a patrol can
// use the same reducer as the results of the restful updat
export const socketUpdatePatrol = (payload) => (dispatch) => {
  const { patrol_data, matches_current_filter } = payload;
  console.log('patrol update', patrol_data, matches_current_filter);
  if (matches_current_filter) {
    dispatch(updatePatrolStore(patrol_data));
  }
};

// likewise, assume that a realtime message to create a patrol
// can use the same reducer
export const socketCreatePatrol = (payload) => (dispatch) => {
  const { patrol_data, matches_current_filter } = payload;
  console.log('patrol create', patrol_data, matches_current_filter);
  if (matches_current_filter) {
    dispatch(updatePatrolStore(patrol_data));
  }
};

export const socketDeletePatrol = (payload) => (dispatch) => {
  console.log('patrol_delete', payload);
  const { patrol_id, matches_current_filter } = payload;
  if (matches_current_filter) {
    dispatch({
      type: REMOVE_PATROL_BY_ID,
      payload: patrol_id,
    });
  }
};

const updatePatrolStore = (...results) => ({
  type: UPDATE_PATROL_STORE,
  payload: results,
});

export const fetchPatrols = () => async (dispatch) => {

  const patrolFilterParamString = calcPatrolFilterForRequest({ params: { page_size: 200 } });

  const { data: { data: patrols } } = await axios.get(`${PATROLS_API_URL}?${patrolFilterParamString}`).catch((error) => {
    console.warn('error fetching patrols', error);
    dispatch({
      type: FETCH_PATROLS_ERROR,
      payload: error,
    });
    return new Error(error);
  });
  dispatch({
    type: FETCH_PATROLS_SUCCESS,
    payload: patrols,
  });
  return patrols;
};

export const createPatrol = (patrol) => (dispatch) => {

  return axios.post(PATROLS_API_URL, patrol)
    .then((response) => {
      dispatch({
        type: CREATE_PATROL_SUCCESS,
        payload: response.data.data,
      });
      dispatch(updatePatrolStore(response.data.data));
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


export const updatePatrol = (patrol) => (dispatch) => {

  let patrolResults;
  let resp;

  return axios.patch(`${PATROLS_API_URL}${patrol.id}`, patrol)
    .then((response) => {
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
        dispatch(updatePatrolStore(patrolResults));
      }
      return resp;
    });
/*     .catch((error) => {
      dispatch({
        type: UPDATE_PATROL_ERROR,
        payload: error,
      });
      return Promise.reject(error);
    }); */
};


export const togglePatrolTrackState = (id) => (dispatch, getState) => {
  const { view: { patrolTrackState } } = getState();
  dispatch({
    type: patrolTrackState.includes(id) ? HIDE_PATROL_TRACK: SHOW_PATROL_TRACK,
    payload: id,
  });
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


export const uploadPatrolFile = (event_id, file, onUploadProgress = (event) => console.log('report file upload update', event)) => (dispatch) => {
  const uploadUrl = `${PATROLS_API_URL}${event_id}/files/`;

  dispatch({
    type: UPLOAD_PATROL_FILES_START,
    payload: {
      event_id,
      file,
    },
  });

  const form = new FormData();
  form.append('filecontent.file', file);

  return axios.post(uploadUrl, form, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  }).then((response) => {
    dispatch({
      type: UPLOAD_PATROL_FILES_SUCCESS,
      payload: response.data.data,
    });
    return response;
  })
    .catch((error) => {
      dispatch({
        type: UPLOAD_PATROL_FILES_ERROR,
        payload: error,
      });
      return Promise.reject(error);
    });
};

const INITIAL_PATROLS_STATE = {
  count: null,
  next: null,
  previous: null,
  results: [],
};

const patrolsReducer = (state = INITIAL_PATROLS_STATE, action) => {
  const { type, payload } = action;

  if (type === FETCH_PATROLS_SUCCESS) {
    return { payload,
      results: payload.results.map(({ id }) => id),
    };
  }

  if (type === REMOVE_PATROL_BY_ID) {
    return {
      ...state,
      results: state.results.filter(id => id !== payload),
    };
  }
  
  return state;
};

// patrol store 
const INITIAL_STORE_STATE = {};
export const patrolStoreReducer = (state = INITIAL_STORE_STATE, { type, payload }) => {
  if (type === CLEAR_PATROL_DATA) {
    return { ...INITIAL_STORE_STATE };
  }

  if (type === FETCH_PATROLS_SUCCESS) {
    const { results } = payload;
    return {
      ...state,
      ...results.reduce((accumulator, item) => ({
        ...accumulator,
        [item.id]: item,
      }), {}),
    };
    
  }

  if (type === UPDATE_PATROL_STORE) {
    const toAdd = payload.reduce((accumulator, patrol) => {

      accumulator[patrol.id] = merge({}, state[patrol.id] || {}, patrol);

      return accumulator;
    }, {});

    return {
      ...state,
      ...toAdd,
    };
  }
  return state;
};

export default globallyResettableReducer(patrolsReducer, INITIAL_PATROLS_STATE);


const INITIAL_PATROL_TRACKS_STATE = [];
export const patrolTracksReducer = (state = INITIAL_PATROL_TRACKS_STATE, { type, payload }) => {
  
  if (type === SHOW_PATROL_TRACK) {
    return [
      ...state,
      payload,
    ];
  }

  if (type === HIDE_PATROL_TRACK) {
    return state.filter(id => id !== payload);
  }

  return state;
};