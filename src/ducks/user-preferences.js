import { GPS_FORMATS } from '../utils/location';
import { TAB_KEYS } from '../constants';

// ACTIONS
const UPDATE_USER_PREFERENCES = 'UPDATE_USER_PREFERENCES';

// ACTION CREATORS
export const updateUserPreferences = (preference) => ({
  type: UPDATE_USER_PREFERENCES,
  payload: preference,
});

//REDUCER
const INITIAL_STATE = {
  gpsFormat: Object.values(GPS_FORMATS)[0],
  enable3D: true,
  sidebarOpen: false,
  sidebarTab: TAB_KEYS.REPORTS,
  autoStartPatrols: false,
  autoEndPatrols: false,
  hideModals: false,
  seenSunsetWarning: false,
  seenTrackAnnouncement: false,
};

export default (state = INITIAL_STATE, action = {}) => {
  const { type, payload } = action;
  switch (type) {
  case (UPDATE_USER_PREFERENCES): {
    return { ...state, ...payload };
  }
  default: {
    return state;
  }
  }
};