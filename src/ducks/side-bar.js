import { TAB_KEYS } from '../constants';
import { updateUserPreferences } from './user-preferences';

// Actions
const OPEN_TAB = 'OPEN_TAB';
const SHOW_DETAIL_VIEW = 'SHOW_DETAIL_VIEW';
const HIDE_DETAIL_VIEW = 'HIDE_DETAIL_VIEW';
const SET_SHOW_SIDE_BAR = 'SET_SHOW_SIDE_BAR';

// Action creators
export const openTab = (tabKey) => (dispatch) => {
  dispatch(updateUserPreferences({ sidebarOpen: true }));
  dispatch({ type: OPEN_TAB, payload: { currentTab: tabKey } });
};

export const showDetailView = (tabKey, data) => (dispatch) => {
  dispatch(updateUserPreferences({ sidebarOpen: true }));
  dispatch({ type: SHOW_DETAIL_VIEW, payload: { currentTab: tabKey, data } });
};

export const hideDetailView = () => ({ type: HIDE_DETAIL_VIEW, payload: {} });

export const showSideBar = () => (dispatch) => {
  dispatch({ type: SET_SHOW_SIDE_BAR, payload: { showSideBar: true } });
};

export const hideSideBar = () => (dispatch) => {
  dispatch({ type: SET_SHOW_SIDE_BAR, payload: { showSideBar: false } });
};

// Reducer
const INITIAL_STATE = {
  currentTab: TAB_KEYS.REPORTS,
  data: null,
  showDetailView: false,
  showSideBar: true,
};

const sideBarReducer = (state = INITIAL_STATE, { type, payload }) => {
  switch (type) {
  case OPEN_TAB:
    return { ...state, currentTab: payload.currentTab, showDetailView: false };

  case SHOW_DETAIL_VIEW:
    return { ...state, currentTab: payload.currentTab, data: payload.data, showDetailView: true };

  case HIDE_DETAIL_VIEW:
    return { ...state, showDetailView: false };

  case SET_SHOW_SIDE_BAR:
    return { ...state, showSideBar: payload.showSideBar };

  default:
    return state;
  }
};

export default sideBarReducer;
