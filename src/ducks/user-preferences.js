import { GPS_FORMATS } from '../utils/location';

// Actions
export const SET_PLAY_SOUND_FOR_NEW_EVENTS = 'USER_PREFERENCES.SET_PLAY_SOUND_FOR_NEW_EVENTS';
export const SET_PLAY_SOUND_FOR_NEW_IN_REACH_MESSAGES = 'USER_PREFERENCES.SET_PLAY_SOUND_FOR_NEW_IN_REACH_MESSAGES';
export const SET_PLAY_SOUND_FOR_RADIO_STATE_CHANGE_TO_RED =
  'USER_PREFERENCES.SET_PLAY_SOUND_FOR_RADIO_STATE_CHANGE_TO_RED';
const UPDATE_USER_PREFERENCES = 'UPDATE_USER_PREFERENCES';

// Action creators
export const updateUserPreferences = (preference) => ({
  type: UPDATE_USER_PREFERENCES,
  payload: preference,
});

export const setPlaySoundForNewEvents = (playSoundForNewEvents) => ({
  payload: playSoundForNewEvents,
  type: SET_PLAY_SOUND_FOR_NEW_EVENTS,
});

export const setPlaySoundForNewInReachMessages = (playSoundForNewInReachMessages) => ({
  payload: playSoundForNewInReachMessages,
  type: SET_PLAY_SOUND_FOR_NEW_IN_REACH_MESSAGES,
});

export const setPlaySoundForRadioStateChangeToRed = (playSoundForRadioStateChangeToRed) => ({
  payload: playSoundForRadioStateChangeToRed,
  type: SET_PLAY_SOUND_FOR_RADIO_STATE_CHANGE_TO_RED,
});

// Reducer
export const INITIAL_STATE = {
  autoEndPatrols: false,
  autoStartPatrols: false,
  enable3D: true,
  gpsFormat: Object.values(GPS_FORMATS)[0],
  hideModals: false,
  playSoundForNewEvents: false,
  playSoundForNewInReachMessages: false,
  playSoundForRadioStateChangeToRed: false,
};

const userPreferencesReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
  case SET_PLAY_SOUND_FOR_NEW_EVENTS:
    return { ...state, playSoundForNewEvents: action.payload };

  case SET_PLAY_SOUND_FOR_NEW_IN_REACH_MESSAGES:
    return { ...state, playSoundForNewInReachMessages: action.payload };

  case SET_PLAY_SOUND_FOR_RADIO_STATE_CHANGE_TO_RED:
    return { ...state, playSoundForRadioStateChangeToRed: action.payload };

  case UPDATE_USER_PREFERENCES:
    return { ...state, ...action.payload };

  default:
    return state;
  }
};

export default userPreferencesReducer;
