import axios, { CancelToken } from 'axios';
import { REACT_APP_DAS_HOST, REACT_APP_DAS_AUTH_TOKEN_URL } from '../constants';
import { clearUserProfile } from '../ducks/user';

const AUTH_URL = `${REACT_APP_DAS_HOST}${REACT_APP_DAS_AUTH_TOKEN_URL}`;

// actions
export const POST_AUTH = 'POST_AUTH';
export const POST_AUTH_SUCCESS = 'POST_AUTH_SUCCESS';
export const POST_AUTH_ERROR = 'POST_AUTH_ERROR';
export const CLEAR_AUTH = 'CLEAR_AUTH';

// master cancel token actions
const RESET_MASTER_CANCEL_TOKEN = 'RESET_MASTER_CANCEL_TOKEN';

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
      });
    /* .catch((error) => {
        dispatch(postAuthError(error));
        throw new Error(error);
      }); */
  };
};

const postAuthSuccess = response => ({
  type: POST_AUTH_SUCCESS,
  payload: response,
});

const postAuthError = error => ({
  type: POST_AUTH_ERROR,
  payload: error,
});

export const clearAuth = () => dispatch => {
  dispatch(clearUserProfile());
  dispatch({
    type: CLEAR_AUTH,
    payload: {},
  });
};

export const resetMasterCancelToken = () => ({
  type: RESET_MASTER_CANCEL_TOKEN,
});

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


const INITIAL_TOKEN_STATE = CancelToken.source();
export const masterRequestTokenReducer = (state = INITIAL_TOKEN_STATE, action = {}) => {
  const { type } = action;
  if (type === RESET_MASTER_CANCEL_TOKEN) {
    state.cancel();
    return CancelToken.source();
  }
  return state;
};