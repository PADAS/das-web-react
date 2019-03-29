import { SOCKET_SUBJECT_STATUS } from './subjects';
import { uuid } from '../utils/string';

const SHOW_POPUP = 'SHOW_POPUP';
const HIDE_POPUP = 'HIDE_POPUP';

export const showPopup = (type, data) => ({
  type: SHOW_POPUP,
  payload: {
    type,
    data,
  },
});

export const hidePopup = (id) => ({
  type: HIDE_POPUP,
  payload: id,
});

export default (state = null, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case SHOW_POPUP: {
      const popup = { ...payload, id: uuid() };
      return popup;
    }
    case HIDE_POPUP: {
      return null;
    }
    case SOCKET_SUBJECT_STATUS: {
      if (!state
        || state.type !== 'subject'
        || !state.data.properties
        || state.data.properties.id !== payload.properties.id) {
        return state;
      }
      const { geometry, properties } = payload;
      return {
        ...state, data: {
          ...state.data,
          geometry,
          properties,
        }
      };
    }
    default: {
      return state;
    }
  }
}