import { TAB_KEYS } from '../constants';
import { updateUserPreferences } from './user-preferences';

// Actions
const OPEN_TAB = 'OPEN_TAB';
const SHOW_DETAIL_VIEW = 'SHOW_DETAIL_VIEW';
const HIDE_DETAIL_VIEW = 'HIDE_DETAIL_VIEW';

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

// Reducer
const INITIAL_STATE = {
  currentTab: TAB_KEYS.REPORTS,
  data: null,
  showDetailView: false,
};

const verticalNavigationBarReducer = (state = INITIAL_STATE, { type, payload }) => {
  switch (type) {
  case OPEN_TAB:
    return { ...state, ...payload, showDetailView: false };

  case SHOW_DETAIL_VIEW:
    return { ...state, ...payload, showDetailView: true };

  case HIDE_DETAIL_VIEW:
    return { ...state, showDetailView: false };

  default:
    return state;
  }
};

export default verticalNavigationBarReducer;
