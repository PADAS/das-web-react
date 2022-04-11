import axios from 'axios';
import { API_URL } from '../constants';
import { setUserRole } from '../utils/analytics';
import globallyResettableReducer from '../reducers/global-resettable';

const USER_API_URL = `${API_URL}user`;
export const CURRENT_USER_API_URL = `${USER_API_URL}/me`;
export const USER_PROFILES_API_URL = `${CURRENT_USER_API_URL}/profiles`;

// actions
const FETCH_CURRENT_USER_SUCCESS = 'FETCH_CURRENT_USER_SUCCESS';
const FETCH_USER_PROFILES_SUCCESS = 'FETCH_USER_PROFILES_SUCCESS';

const SET_USER_PROFILE = 'SET_USER_PROFILE';
const CLEAR_USER_PROFILE = 'CLEAR_USER_PROFILE';

const SET_USER_LOCATION_ACESS_GRANTED = 'SET_USER_LOCATION_ACESS_GRANTED';

// action creators

export const fetchCurrentUser = () => (dispatch, getState) => axios.get(CURRENT_USER_API_URL)
  .then(( { data: { data } }) => {
    if (!!data.role && data.role.length > 0) {
      setUserRole(data.role);
    }
    dispatch(fetchUserSuccess(data));
    const { data: { selectedUserProfile } } = getState();
    if (selectedUserProfile?.id && selectedUserProfile.id !== data.id) {
      return axios.get(`${USER_API_URL}/${selectedUserProfile.id}`)
        .then(({ data: { data: profileUser } }) => {
          dispatch(setUserProfile(profileUser));
        });
    }
  })
  .catch((error) => {
    console.log('error fetching current user', error);
    throw new Error(error);
  });


export const fetchCurrentUserProfiles = () => async (dispatch) => {
  try {
    const { data: { data } } = await axios.get(USER_PROFILES_API_URL);
    dispatch(fetchUserProfileSuccess(data));
  } catch (e) {
    return Promise.reject(e);
  }
};

export const setUserProfile = (profile = {}, setCookie) => (dispatch) => {
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

export const setUserLocationAccessGranted = (granted = false) => ({
  type: SET_USER_LOCATION_ACESS_GRANTED,
  payload: granted,
});


// reducers
const INITIAL_USER_STATE = {};
const userReducer = (state = INITIAL_USER_STATE, action = {}) => {
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

export default userReducer;

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