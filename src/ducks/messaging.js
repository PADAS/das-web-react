import unionBy from 'lodash/unionBy';

const FETCH_MESSAGES_SUCCESS = 'FETCH_MESSAGES_SUCCESS';
const UPDATE_MESSAGE = 'UPDATE_MESSAGE';
const NEW_MESSAGE = 'NEW_MESSAGE';
const SOCKET_MESSAGE_UPDATE = 'SOCKET_MESSAGE_UPDATE';

export const fetchMessagesSuccess = payload => ({
  type: FETCH_MESSAGES_SUCCESS,
  payload,
});

export const updateMessage = payload => ({
  type: UPDATE_MESSAGE,
  payload,
});

export const newMessage = payload => ({
  type: NEW_MESSAGE,
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
      const subject = message.message_type === 'inbox' ? message.sender : message.receiver;

      if (!subject) return state;
      
      const { id } = subject;
      
      return {
        ...accumulator,
        [id]: unionBy([message], accumulator[id] || [], state[id] || [], 'id')
          .sort((a, b) => new Date(b.message_time) - new Date(a.message_time)),
      };
    }, {});
    return {
      ...state,
      ...updates,
    };
  }

  if ([SOCKET_MESSAGE_UPDATE, NEW_MESSAGE, UPDATE_MESSAGE].includes(type)) {
    const { receiver }  = payload;
    
    return {
      ...state,
      [receiver.id]: unionBy([payload], state[receiver.id] || [], 'id'),
    };
  }
};