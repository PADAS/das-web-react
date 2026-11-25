import axios, { isCancel } from 'axios';

import { API_URL } from '../constants';
import globallyResettableReducer from '../reducers/global-resettable';
import { selectActiveProfileId, selectSignedInUser } from '../selectors/user';

export const USER_API_URL = `${API_URL}user`;
export const CURRENT_USER_API_URL = `${USER_API_URL}/me`;
export const USER_PROFILES_API_URL = `${CURRENT_USER_API_URL}/profiles`;

// Actions
export const FETCH_CURRENT_USER_SUCCESS = 'FETCH_CURRENT_USER_SUCCESS';
const FETCH_USER_PROFILES_SUCCESS = 'FETCH_USER_PROFILES_SUCCESS';

export const SET_USER_PROFILE = 'SET_USER_PROFILE';
const CLEAR_USER_PROFILE = 'CLEAR_USER_PROFILE';

const SET_USER_LOCATION_ACESS_GRANTED = 'SET_USER_LOCATION_ACESS_GRANTED';

// Action creators
export const fetchCurrentUser = () => async (dispatch, getState) => {
  try {
    dispatch(fetchUserSuccess((await axios.get(CURRENT_USER_API_URL)).data.data));
  } catch (error) {
    console.warn('error fetching current user', error);
    throw error;
  }

  const activeProfileId = selectActiveProfileId(getState());
  if (activeProfileId && activeProfileId !== selectSignedInUser(getState()).id) {
    await dispatch(fetchUserProfile(activeProfileId));
  }
};

// The profiles list lacks permissions, so a profile is stored from its record.
export const fetchUserProfile = (profileId, setCookie, signal) => async (dispatch) => {
  try {
    const profileUserResponse = await axios.get(`${USER_API_URL}/${profileId}`, {
      headers: { 'USER-PROFILE': profileId },
      signal,
    });
    dispatch(setUserProfile(profileUserResponse.data.data, setCookie));
  } catch (error) {
    if (!isCancel(error)) {
      console.warn('error fetching user profile', error);
    }
    throw error;
  }
};

export const fetchCurrentUserProfiles = () => async (dispatch) => {
  try {
    const { data: { data } } = await axios.get(USER_PROFILES_API_URL);
    dispatch(fetchUserProfilesSuccess(data));
  } catch (e) {
    return Promise.reject(e);
  }
};

export const setUserProfile = (profile = {}, setCookie) => (dispatch) => {
  if (setCookie) {
    document.cookie = `userProfile=${profile.id}`;
  } else {
    clearProfileCookie();
  }
  dispatch({
    payload: profile,
    type: SET_USER_PROFILE,
  });
};

const clearProfileCookie = () => {
  document.cookie = 'userProfile=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

export const clearUserProfile = () => (dispatch) => {
  clearProfileCookie();
  dispatch({ type: CLEAR_USER_PROFILE });
};

const fetchUserSuccess = (payload) => ({
  payload,
  type: FETCH_CURRENT_USER_SUCCESS,
});

const fetchUserProfilesSuccess = (payload) => ({
  payload,
  type: FETCH_USER_PROFILES_SUCCESS,
});

export const setUserLocationAccessGranted = (granted = false) => ({
  payload: granted,
  type: SET_USER_LOCATION_ACESS_GRANTED,
});

// Reducer
const INITIAL_USER_STATE = {};
const userReducer = globallyResettableReducer((state = INITIAL_USER_STATE, action = {}) => {
  const { type, payload } = action;

  switch (type) {
  case (FETCH_CURRENT_USER_SUCCESS): {
    return payload;
  }
  default: {
    return state;
  }
  }
}, INITIAL_USER_STATE);

const INITIAL_USER_PROFILE_STATE = [];
export const userProfilesReducer = globallyResettableReducer((state, action = {}) => {
  const { type, payload } = action;

  switch (type) {
  case (FETCH_USER_PROFILES_SUCCESS): {
    return payload;
  }
  default: {
    return state;
  }
  }
}, INITIAL_USER_PROFILE_STATE);

const INITIAL_SELECTED_PROFILE_STATE = {};
export const selectedUserProfileReducer = globallyResettableReducer((state, action = {}) => {
  const { type, payload } = action;

  switch (type) {
  case (SET_USER_PROFILE): {
    return payload;
  }
  case (CLEAR_USER_PROFILE): {
    return INITIAL_SELECTED_PROFILE_STATE;
  }
  default: {
    return state;
  }
  }
}, INITIAL_SELECTED_PROFILE_STATE);

const INITIAL_USER_LOCATION_ACCESS_STATE = { granted: false };
export const userLocationAccessGrantedReducer = (state = INITIAL_USER_LOCATION_ACCESS_STATE, action) => {
  const { type, payload } = action;

  if (type === SET_USER_LOCATION_ACESS_GRANTED) {
    return { granted: payload };
  }

  return state;
};

export default userReducer;
