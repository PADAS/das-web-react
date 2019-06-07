import { uuid } from '../utils/string';

// actions
const ADD_MODAL = 'ADD_MODAL';
const REMOVE_MODAL = 'REMOVE_MODAL';
const CLEAR_MODALS = 'CLEAR_MODALS';

const SET_MODAL_VISIBILITY = 'SET_MODAL_VISIBILITY';


//action creators
export const addModal = payload => ({
  type: ADD_MODAL,
  payload: { id: uuid(), ...payload },
});

export const removeModal = id => ({
  type: REMOVE_MODAL,
  payload: id,
});

export const clearModals = () => ({
  type: CLEAR_MODALS
});


export const setModalVisibilityState = (canShow) => ({
  type: SET_MODAL_VISIBILITY,
  payload: canShow,
});


//reducer
const INITIAL_STATE = {
  canShowModals: true,
  modals: [],
}

export default (state = INITIAL_STATE, action = {}) => {
  const { type, payload } = action;
  if (type === ADD_MODAL) {
    return {
      ...state,
      modals: [payload, ...state.modals],
    }
  }
  if (type === REMOVE_MODAL) {
    return {
      ...state,
      modals: state.modals.filter(item => item.id !== payload),
    }
  }
  if (type === SET_MODAL_VISIBILITY) {
    return {
      ...state,
      canShowModals: payload,
    }
  }
  if (type === CLEAR_MODALS) {
    return {
      ...state,
      modals: [],
    }
  }
  // if (type === )
  return state;
}
