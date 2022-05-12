import { TAB_KEYS } from '../constants';

// Actions
const SET_SHOW_SIDE_BAR = 'SET_SHOW_SIDE_BAR';

// Action creators
export const showSideBar = () => (dispatch) => {
  dispatch({ type: SET_SHOW_SIDE_BAR, payload: { showSideBar: true } });
};

export const hideSideBar = () => (dispatch) => {
  dispatch({ type: SET_SHOW_SIDE_BAR, payload: { showSideBar: false } });
};

// Reducer
const INITIAL_STATE = { showSideBar: true };

const sideBarReducer = (state = INITIAL_STATE, { type, payload }) => {
  switch (type) {
  case SET_SHOW_SIDE_BAR:
    return { ...state, showSideBar: payload.showSideBar };

  default:
    return state;
  }
};

export default sideBarReducer;
