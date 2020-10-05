import axios from 'axios';
import { API_URL } from '../constants';

import globallyResettableReducer from '../reducers/global-resettable';

const PATROLS_API_URL = `${API_URL}activity/patrols/`;

const FETCH_PATROLS_SUCCESS = 'FETCH_PATROLS_SUCCESS';
const FETCH_PATROLS_ERROR = 'FETCH_PATROLS_ERROR';

const CREATE_PATROL_START = 'CREATE_PATROL_START';
const CREATE_PATROL_SUCCESS = 'CREATE_PATROL_SUCCESS';
const CREATE_PATROL_ERROR = 'CREATE_PATROL_ERROR';

const UPDATE_PATROL_START = 'UPDATE_PATROL_START';
const UPDATE_PATROL_SUCCESS = 'UPDATE_PATROL_SUCCESS';
const UPDATE_PATROL_ERROR = 'UPDATE_PATROL_ERROR';

const ADD_PATROL_NOTE_START = 'ADD_PATROL_NOTE_START';
const ADD_PATROL_NOTE_SUCCESS = 'ADD_PATROL_NOTE_SUCCESS';
const ADD_PATROL_NOTE_ERROR = 'ADD_PATROL_NOTE_ERROR';

const UPLOAD_PATROL_FILES_START = 'UPLOAD_PATROL_FILES_START';
const UPLOAD_PATROL_FILES_SUCCESS = 'UPLOAD_PATROL_FILES_SUCCESS';
const UPLOAD_PATROL_FILES_ERROR = 'UPLOAD_PATROL_FILES_ERROR';

const REMOVE_PATROL_BY_ID = 'REMOVE_PATROL_BY_ID';

export const fetchPatrols = (filter) => async (dispatch) => {

  const { data: { data: patrols } } = await axios.get(`${PATROLS_API_URL}?page_size=200&${filter}`).catch((error) => {
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
  dispatch({
    type: CREATE_PATROL_START,
    payload: patrol,
  });

  return axios.post(PATROLS_API_URL, patrol)
    .then((response) => {
      dispatch({
        type: CREATE_PATROL_SUCCESS,
        payload: response.data.data,
      });
      // dispatch(updateEventStore(response.data.data));
      return response;
    })
    .catch((error) => {
      dispatch({
        type: CREATE_PATROL_ERROR,
        payload: error,
      });
      return Promise.reject(error);
    });
};


export const updatePatrol = (event) => (dispatch) => {
  dispatch({
    type: UPDATE_PATROL_START,
    payload: event,
  });

  let eventResults;
  let resp;

  return axios.patch(`${PATROLS_API_URL}${event.id}`, event)
    .then((response) => {
      eventResults = response.data.data;
      resp = response;
      return true;
      // return Promise.resolve(validateReportAgainstCurrentEventFilter(eventResults));
    })
    .then((matchesEventFilter) => {
      if (!matchesEventFilter) {
        dispatch({
          type: REMOVE_PATROL_BY_ID,
          payload: event.id,
        });
      } else {
        dispatch({
          type: UPDATE_PATROL_SUCCESS,
          payload: eventResults,
        });
      }
      // dispatch(updateEventStore(eventResults));
      return resp;
    })
    .catch((error) => {
      dispatch({
        type: UPDATE_PATROL_ERROR,
        payload: error,
      });
      return Promise.reject(error);
    });
};

export const addNoteToPatrol = (patrol_id, note) => (dispatch) => {
  dispatch({
    type: ADD_PATROL_NOTE_START,
    payload: note,
  });
  return axios.post(`${PATROLS_API_URL}${patrol_id}/notes/`, note)
    .then((response) => {
      dispatch({
        type: ADD_PATROL_NOTE_SUCCESS,
        payload: response.data.data,
      });
      return response;
    })
    .catch((error) => {
      dispatch({
        type: ADD_PATROL_NOTE_ERROR,
        payload: error,
      });
      return Promise.reject(error);
    });
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
    return payload;
  }
  
  return state;
};


export default globallyResettableReducer(patrolsReducer, INITIAL_PATROLS_STATE);