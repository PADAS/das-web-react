import merge from 'lodash/merge';

const TAB_KEYS = {
  REPORTS: 'reports',
  LAYERS: 'layers',
  PATROLS: 'patrols',
};

const TOGGLE_SIDEBAR_STATE = 'TOGGLE_SIDEBAR_STATE';
const SET_TAB = 'SET_TAB';
const UNDO_SIDEBAR_STATE_CHANGE = 'UNDO_SIDEBAR_STATE_CHANGE';
const REDO_SIDEBAR_STATE_CHANGE = 'REDO_SIDEBAR_STATE_CHANGE';

const undoSidebarStateChange = () => ({
  type: UNDO_SIDEBAR_STATE_CHANGE,
});

const redoSidebarStateChange = () => ({
  type: REDO_SIDEBAR_STATE_CHANGE,
});

const toggleSidebarState = () => ({
  type: TOGGLE_SIDEBAR_STATE,
});

const setTab = tab => ({
  type: SET_TAB,
  payload: tab,
});

const INITIAL_STATE = {
  past: [],
  current: {
    sidebarOpen: false,
    currentTab: TAB_KEYS.REPORTS,
  },
  future: [],
};

const updateSidebarState = (update, state) => {
  const newState = merge({}, state.current, update);

};

const sidebarReducer = (state = INITIAL_STATE, action) => {
  return state;
};