import { uuid } from '../utils/string';

// actions
const SHOW_MODAL = 'SHOW_MODAL';
const HIDE_MODAL = 'HIDE_MODAL';
const CLEAR_MODALS = 'CLEAR_MODALS';


//action creators
export const showModal = modal => ({
  type: SHOW_MODAL,
  payload: modal,
});

export const hideModal = id => ({
  type: HIDE_MODAL,
  payload: id,
});

export const clearModals = () => ({
  type: CLEAR_MODALS
});


//reducer
const INITIAL_STATE = [];
export default (state = INITIAL_STATE, action = {}) => {
  const { type, payload } = action;
  if (type === SHOW_MODAL) {
    return [{ id: uuid(), ...payload }, ...state];
  }
  if (type === HIDE_MODAL) {
    return state.filter(item => item.id !== payload);
  }
  if (type === CLEAR_MODALS) {
    return INITIAL_STATE;
  }
  return state;
}
