const SET_VIRTUAL_DATE = 'SET_VIRTUAL_DATE';
const CLEAR_VIRTUAL_DATE = 'CLEAR_VIRTUAL_DATE';
const HIDE_TIME_SLIDER = 'HIDE_TIME_SLIDER';
const SHOW_TIME_SLIDER = 'SHOW_TIME_SLIDER';

export const setVirtualDate = (date) => ({
  type: SET_VIRTUAL_DATE,
  payload: date,
});

export const clearVirtualDate = () => ({
  type: CLEAR_VIRTUAL_DATE,
});

const INITIAL_STATE = {
  active: false,
  virtualDate: null,
};

export default (state = INITIAL_STATE, { type, payload }) => {
  if (type === SET_VIRTUAL_DATE) {
    return {
      ...state,
      virtualDate: payload,
    };
  }
  if (type === CLEAR_VIRTUAL_DATE) {
    return {
      ...state,
      virtualDate: null,
    };
  }
  if (type === HIDE_TIME_SLIDER) {
    return INITIAL_STATE;
  }
  if (type === SHOW_TIME_SLIDER) { 
    return {
      ...state,
      active: true,
    };
  }
  return state;
};