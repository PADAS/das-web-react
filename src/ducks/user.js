import axios from 'axios';
import { API_URL } from '../constants';
import { setUserRole } from '../utils/analytics';

export const CURRENT_USER_API_URL = `${API_URL}user/me`;
export const USER_PROFILES_API_URL = `${CURRENT_USER_API_URL}/profiles`;

// actions
const FETCH_CURRENT_USER_SUCCESS = 'FETCH_CURRENT_USER_SUCCESS'; 
const FETCH_USER_PROFILES_SUCCESS = 'FETCH_USER_PROFILES_SUCCESS';

const SET_USER_PROFILE = 'SET_USER_PROFILE';
const CLEAR_USER_PROFILE = 'CLEAR_USER_PROFILE';

// action creators

export const fetchCurrentUser = (config = {}) => async (dispatch) => {
  try {
    const { data: { data } } = await axios.get(CURRENT_USER_API_URL, config);
    if (!!data.role && data.role.length > 0) {
      setUserRole(data.role);
    }
    dispatch(fetchUserSuccess(data));
  } catch (e) {
    return Promise.reject(e);
  }
};

export const fetchCurrentUserProfiles = () => async (dispatch) => {
  try {
    const { data: { data } } = await axios.get(USER_PROFILES_API_URL);
    dispatch(fetchUserProfileSuccess(data));
  } catch (e) {
    return Promise.reject(e);
  }
};

export const setUserProfile = (profile, setCookie) => (dispatch) => {
  if (setCookie) {
    document.cookie = `userProfile=${profile.id}`; // set profile cookie
  } else {
    clearProfileCookie();
  }
  dispatch({
    type: SET_USER_PROFILE,
    payload: profile,
  });
};

const clearProfileCookie = () => {
  document.cookie = 'userProfile=;expires=Thu, 01 Jan 1970 00:00:01 GMT;'; // expire profile cookie
}; 

export const clearUserProfile = () => (dispatch) => {
  clearProfileCookie(); // expire profile cookie
  dispatch({
    type: CLEAR_USER_PROFILE,
  });
}; 
 
const fetchUserSuccess = payload => ({
  type: FETCH_CURRENT_USER_SUCCESS,
  payload,
});

const fetchUserProfileSuccess = payload => ({
  type: FETCH_USER_PROFILES_SUCCESS,
  payload,
});


// reducers
const INITIAL_USER_STATE = {};
export default (state = INITIAL_USER_STATE, action = {}) => {
  const { type, payload } = action;
  
  switch (type) {
  case (FETCH_CURRENT_USER_SUCCESS): {
    return payload;
  }
  default: {
    return state;
  }
  }
};


const INITIAL_USER_PROFILE_STATE = [];
export const userProfilesReducer = (state = INITIAL_USER_PROFILE_STATE, action = {}) => {
  const { type, payload } = action;
  
  switch (type) {
  case (FETCH_USER_PROFILES_SUCCESS): {
    return payload;
  }
  default: {
    return state;
  }
  }
};

const INITIAL_SELECTED_PROFILE_STATE = {};
export const selectedUserProfileReducer = (state = INITIAL_SELECTED_PROFILE_STATE, action = {}) => {
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
};