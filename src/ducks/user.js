import axios from 'axios';
import { API_URL } from '../constants';
import { setUserRole } from '../utils/analytics'

export const CURRENT_USER_API_URL = `${API_URL}user/me`;
export const USER_PROFILES_API_URL = `${CURRENT_USER_API_URL}/profiles`;

// actions
const FETCH_CURRENT_USER_SUCCESS = 'FETCH_CURRENT_USER_SUCCESS'; 
const FETCH_USER_PROFILES_SUCCESS = 'FETCH_USER_PROFILES_SUCCESS';

const SET_USER_PROFILE = 'SET_USER_PROFILE';
const CLEAR_USER_PROFILE = 'CLEAR_USER_PROFILE';

// action creators

export const fetchCurrentUser = () => async (dispatch) => {
  const { data: { data } } = await axios.get(CURRENT_USER_API_URL)
    .catch(error => console.log('error getting user', error));
  if(!!data.role && data.role.length > 0) {
    console.log('Set user role: ', data.role);
    setUserRole(data.role);
  }
  dispatch(fetchUserSuccess(data));
};

export const fetchCurrentUserProfiles = () => async (dispatch) => {
  const { data: { data } } = await axios.get(USER_PROFILES_API_URL)
    .catch(error => console.log('error getting user profiles', error));
  
  dispatch(fetchUserProfileSuccess(data));
};

export const setUserProfile = payload => ({
  type: SET_USER_PROFILE,
  payload,
});

export const clearUserProfile = () => ({
  type: CLEAR_USER_PROFILE,
});
 
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
}


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
}