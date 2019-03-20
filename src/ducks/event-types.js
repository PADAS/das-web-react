import axios from 'axios';
import { API_URL } from '../constants';
export const EVENT_TYPE_API_URL = `${API_URL}activity/events/eventtypes`;

export const FETCH_EVENT_TYPES = 'FETCH_EVENT_TYPES';
export const FETCH_EVENT_TYPES_SUCCESS = 'FETCH_EVENT_TYPES_SUCCESS';
export const FETCH_EVENT_TYPES_ERROR = 'FETCH_EVENT_TYPES_ERROR';

export const fetchEventTypes = () => {
  return function (dispatch) {
    return axios.get(EVENT_TYPE_API_URL)
      .then((response) => {
        dispatch(fetchEventTypesSucess(response));
      })
      .catch((error) => {
        dispatch(fetchEventTypesError(error));
      });
  };
};

const fetchEventTypesSucess = response => ({
  type: FETCH_EVENT_TYPES_SUCCESS,
  payload: response.data,
});

const fetchEventTypesError = error => ({
  type: FETCH_EVENT_TYPES_ERROR,
});

// reducer
const INITIAL_STATE = [];
export default function reducer(state = INITIAL_STATE, action = {}) {
  switch (action.type) {
    case FETCH_EVENT_TYPES_SUCCESS: {
      return action.payload;
    }
    case FETCH_EVENT_TYPES_ERROR: {
      return [];
    }
    default: {
      return state;
    }
  }
};