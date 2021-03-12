import unionBy from 'lodash/unionBy';

const FETCH_MESSAGES_SUCCESS = 'FETCH_MESSAGES_SUCCESS';
const UPDATE_MESSAGE = 'UPDATE_MESSAGE';
const SOCKET_MESSAGE_UPDATE = 'SOCKET_MESSAGE_UPDATE';

export const fetchMessagesSuccess = payload => ({
  type: FETCH_MESSAGES_SUCCESS,
  payload,
});

export const updateMessage = payload => ({
  type: UPDATE_MESSAGE,
  payload,
});


export const updateMessageFromRealtime = payload => ({
  type: SOCKET_MESSAGE_UPDATE,
  payload,
});


export const messageStoreReducer = (state = {}, action) => {
  const { type, payload } = action;

  if (type === FETCH_MESSAGES_SUCCESS) {
    const updates = payload.reduce((accumulator, message) => {
      const { receiver_id }  = message;
      return {
        ...accumulator,
        [receiver_id]: unionBy([message], state[receiver_id] || [], 'id'),
      };
    }, {});
    return {
      ...state,
      ...updates,
    };
  }

  if (type === SOCKET_MESSAGE_UPDATE) {
    const { receiver_id }  = payload;
    
    return {
      ...state,
      [receiver_id]: unionBy([payload], state[receiver_id] || [], 'id'),
    };
  }
};