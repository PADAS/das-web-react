import axios from 'axios';
import unionBy from 'lodash/unionBy';

import store from '../store';

import { API_URL } from '../constants';

import { objectToParamString, recursivePaginatedQuery } from '../utils/query';

import { messageIsValidForDisplay } from '../utils/messaging';

const MAXIMUM_SUBJECT_IDS_PER_REQUEST = 25;

const FETCH_MESSAGES_SUCCESS = 'FETCH_MESSAGES_SUCCESS';
const UPDATE_UNREAD_MESSAGES_COUNT = 'UPDATE_UNREAD_MESSAGES_COUNT';
const REMOVE_MESSAGE = 'REMOVE_MESSAGE';
const SOCKET_MESSAGE_UPDATE = 'SOCKET_MESSAGE_UPDATE';

export const MESSAGING_API_URL = `${API_URL}messages/`;

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

export const updateUnreadMessagesCount = (payload) => ({
  type: UPDATE_UNREAD_MESSAGES_COUNT,
  payload,
});

const { get, post } = axios;

export const fetchUnreadMessagesCount = () => axios.get(`${MESSAGING_API_URL}?include_additional_data=false&page_size=0&read=false`);

export const fetchMessages = (params = {}) => {
  const paramString = objectToParamString(
    { include_additional_data: false, page_size: 25, ...params },
  );

  return get(`${MESSAGING_API_URL}?${paramString}`);
};

export const fetchAllMessages = async (params = {}) => {
  if (params.subject_id) {
    // If the parameters of the request includes a string of subject ids,
    // divide them in chunks to avoid errors due to enormous requests.
    const subjectIdsChunks = [];
    const subjectIds = params.subject_id.split(',');
    for (let i = 0; i < subjectIds.length; i += MAXIMUM_SUBJECT_IDS_PER_REQUEST) {
      subjectIdsChunks.push(subjectIds.slice(i, i + MAXIMUM_SUBJECT_IDS_PER_REQUEST).join(','));
    }

    // Do the recursive paginated query for the messages of each chunk of
    // subject ids in parallel.
    const responses = await Promise.all(subjectIdsChunks.map((subjectIdsChunk) => recursivePaginatedQuery(
      fetchMessages({ ...params, subject_id: subjectIdsChunk })
    )));

    // Flatten the responses and sort them by message time, as the server would
    // have responded in a single request.
    return responses.flat().sort((messageA, messageB) => messageA.message_time < messageB.message_time ? 1 : -1);
  }

  // If the parameters do not include subject ids, do a single recurisve
  // paginated query.
  return recursivePaginatedQuery(fetchMessages(params));
};

export const fetchMessagesNextPage = url => get(url);

export const bulkReadMessages = (ids) => post(MESSAGING_API_URL,
  {
    ids,
    bulk_read: true,
    read: true,
  },
);

export const sendMessage = (url, message) => post(url, message);

export const INITIAL_MESSAGE_LIST_STATE = {
  loaded: false,
  results: [],
  next: null,
  previous: null,
  count: 0,
  unreadMessagesCount: 0,
};
export const messageListReducer = (state = INITIAL_MESSAGE_LIST_STATE, action) => {
  const { refresh, type, payload } = action;

  if (type === FETCH_MESSAGES_SUCCESS) {
    const withOnlyValidMessages = {
      ...payload,
      results: payload.results.filter(msg => messageIsValidForDisplay(msg, store.getState().data.subjectStore)),
    };

    if (refresh) return withOnlyValidMessages;

    return {
      ...payload,
      results: unionBy(state.results || [], withOnlyValidMessages.results, 'id')
    };
  }

  if (type === SOCKET_MESSAGE_UPDATE) {
    if (!messageIsValidForDisplay(payload, store.getState().data.subjectStore)) return state;

    return {
      ...state,
      results: unionBy([payload], state.results || [], 'id'),
    };
  }

  if (type === UPDATE_UNREAD_MESSAGES_COUNT) {
    return {
      ...state,
      unreadMessagesCount: payload,
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