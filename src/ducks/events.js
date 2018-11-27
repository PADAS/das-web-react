import axios from 'axios';
import { API_URL } from '../constants';

const EVENT_API_URL = `${API_URL}activity/events/`;

// actions
export const FETCH_EVENTS = 'FETCH_EVENTS';
export const FETCH_EVENTS_SUCCESS = 'FETCH_EVENTS_SUCCESS';
export const FETCH_EVENTS_ERROR = 'FETCH_EVENTS_ERROR';


export const CREATE_EVENT = 'CREATE_EVENT';
export const UPDATE_EVENT = 'UPDATE_EVENT';

// action creators
export const fetchEvents = (config = {}) => {
  return function (dispatch) {
    return axios.get(EVENT_API_URL, config)
      .then((response) => {
        dispatch(fetchEventsSucess(response));
      })
      .catch((error) => {
        dispatch(fetchEventsError(error));
      });
  };
};

const fetchEventsSucess = response => ({
  type: FETCH_EVENTS_SUCCESS,
  payload: response.data,
});

const fetchEventsError = error => ({
  type: FETCH_EVENTS_ERROR,
  payload: error,
});

const INITIAL_STATE = {
  results: [],
};

// reducer
export default function reducer(state = INITIAL_STATE, action = {}) {
  switch (action.type) {
    case FETCH_EVENTS_SUCCESS: {
      return action.payload.data;
    }
    case FETCH_EVENTS_ERROR: {
      return action.payload;
    }
    default: {
      return state;
    }
  }
};