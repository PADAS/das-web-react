import axios from 'axios';
import { REACT_APP_DAS_HOST, REACT_APP_DAS_AUTH_TOKEN_URL } from '../constants';

const AUTH_URL = `${REACT_APP_DAS_HOST}${REACT_APP_DAS_AUTH_TOKEN_URL}`;

// actions
export const POST_AUTH = 'POST_AUTH';
export const POST_AUTH_SUCCESS = 'POST_AUTH_SUCCESS';
export const POST_AUTH_ERROR = 'POST_AUTH_ERROR';
export const CLEAR_AUTH = 'CLEAR_AUTH';


// action creators
export const postAuth = (userData) => {
  return function (dispatch) {
    const formData = new FormData();
    formData.set('grant_type', 'password');
    formData.set('client_id', 'das_web_client');
    Object.keys(userData).forEach(item => {
      formData.set(item, userData[item]);
    });

    return axios.post(AUTH_URL, formData)
      .then(response => {
        dispatch(postAuthSuccess(response));
      })
      .catch(error => {
        dispatch(postAuthError(error));
      });
  }
}

const postAuthSuccess = response => ({
  type: POST_AUTH_SUCCESS,
  payload: response,
});

const postAuthError = error => ({
  type: POST_AUTH_ERROR,
  payload: error,
});

export const clearAuth = () => {
  return {
    type: CLEAR_AUTH,
    payload: {},
  };
};


// reducer
const INITIAL_STATE = {};
export default function reducer(state = INITIAL_STATE, action = {}) {
  switch (action.type) {
    case POST_AUTH_SUCCESS: {
      return action.payload.data;
    }
    case CLEAR_AUTH: {
      return action.payload;
    }
    default: {
      return state;
    }
  }
};