import axios from 'axios';
import unionBy from 'lodash/unionBy';

import { API_URL } from '../constants';

const FETCH_MESSAGES_SUCCESS = 'FETCH_MESSAGES_SUCCESS';
const REMOVE_MESSAGE = 'REMOVE_MESSAGE';
export const FETCH_MESSAGES_FOR_SUBJECT_SUCCESS = 'FETCH_MESSAGES_FOR_SUBJECT_SUCCESS';
const SOCKET_MESSAGE_UPDATE = 'SOCKET_MESSAGE_UPDATE';

const MESSAGING_API_URL = `${API_URL}messages/`;

export const fetchMessagesSuccess = (payload, refresh = false) => ({
  type: FETCH_MESSAGES_SUCCESS,
  payload,
  refresh,
});


export const updateMessageFromRealtime = payload => ({
  type: SOCKET_MESSAGE_UPDATE,
  payload,
}); 

export const removeMessageById = id => ({
  type: REMOVE_MESSAGE,
  payload: id,
});

const { get, post, patch } = axios;

export const fetchMessages = (params = {}) => get(MESSAGING_API_URL, { params: {
  ...params, include_additional_data: false, page_size: 150,
} });

export const sendMessage = (url, message) => post(url, message);
export const readMessage = (message) => patch(`${MESSAGING_API_URL}${message.id}`, { read: true });


export const INITIAL_MESSAGE_LIST_STATE = {
  loaded: false,
  results: [],
  next: null,
  previous: null,
  count: 0,
};
export const messageListReducer = (state = INITIAL_MESSAGE_LIST_STATE, action) => {
  const { refresh, type, payload } = action;

  if (type === FETCH_MESSAGES_SUCCESS) {
    if (refresh) return payload;

    return {
      ...payload,
      results: unionBy(payload.results, state.results || [], 'id')
    };
  }

  if (type === SOCKET_MESSAGE_UPDATE) {
    return {
      ...state,
      results: unionBy([payload], state.results || [], 'id'),
    };
  }

  if (type === REMOVE_MESSAGE) {
    return {
      ...state,
      results: state.results.filter(({ id }) => id !== payload),
    };
  }

  return state;
};