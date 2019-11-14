import axios from 'axios';

import { API_URL } from '../constants';
import { updateEventFilter } from './event-filter';

export const EVENT_TYPE_API_URL = `${API_URL}activity/events/eventtypes`;

export const FETCH_EVENT_TYPES = 'FETCH_EVENT_TYPES';
export const FETCH_EVENT_TYPES_SUCCESS = 'FETCH_EVENT_TYPES_SUCCESS';
export const FETCH_EVENT_TYPES_ERROR = 'FETCH_EVENT_TYPES_ERROR';

export const fetchEventTypes = () => dispatch => axios.get(EVENT_TYPE_API_URL)
  .then((response) => {
    dispatch(fetchEventTypesSuccess(response));
  });

const fetchEventTypesSuccess = response => dispatch => {
  dispatch(updateEventFilter({
    filter:
    {
      event_type: response.data.data.map(({ id }) => id)
    }
  }));
  dispatch({
    type: FETCH_EVENT_TYPES_SUCCESS,
    payload: response.data.data,
  });
};

// reducer
const INITIAL_STATE = [];
export default function reducer(state = INITIAL_STATE, action = {}) {
  switch (action.type) {
  case FETCH_EVENT_TYPES_SUCCESS: {
    return action.payload;
  }
  default: {
    return state;
  }
  }
};