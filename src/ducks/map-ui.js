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

export default (state = [], action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case SHOW_POPUP: {
      const popup = { ...payload, id: uuid() }
      return [ ...state, popup ];
    }
    case HIDE_POPUP: {
      return state.filter(popup => popup.id !== payload);
    }
    default: {
      return state;
    }
  }
}