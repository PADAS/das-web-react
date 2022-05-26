import axios, { CancelToken } from 'axios';
import { DAS_HOST, REACT_APP_DAS_AUTH_TOKEN_URL } from '../constants';
import { clearUserProfile } from '../ducks/user';
import { resetGlobalState } from '../reducers/global-resettable';
import { deleteAuthTokenCookie, deleteTemporaryAccessTokenCookie, deleteCsrfToken, getAuthTokenFromCookies } from '../utils/auth';

const AUTH_URL = `${DAS_HOST}${REACT_APP_DAS_AUTH_TOKEN_URL}`;

// actions
export const POST_AUTH = 'POST_AUTH';
export const POST_AUTH_SUCCESS = 'POST_AUTH_SUCCESS';
export const POST_AUTH_ERROR = 'POST_AUTH_ERROR';
export const CLEAR_AUTH = 'CLEAR_AUTH';

// master cancel token actions
const RESET_MASTER_CANCEL_TOKEN = 'RESET_MASTER_CANCEL_TOKEN';

// action creators
export const postAuth = (userData) => (dispatch) => {
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
};

const postAuthSuccess = response => (dispatch) => {
  document.cookie = `token=${response.data.access_token};path=/`;
  dispatch({
    type: POST_AUTH_SUCCESS,
    payload: response,
  });
};

export const clearAuth = () => dispatch => {
  return new Promise((resolve) => {

    deleteAuthTokenCookie();
    deleteTemporaryAccessTokenCookie();
    deleteCsrfToken();
    setTimeout(() => {
      dispatch(clearUserProfile());
      dispatch({
        type: CLEAR_AUTH,
        payload: {},
      });
      dispatch(resetGlobalState());
      resolve();
    }, 100);
  });
};

export const resetMasterCancelToken = () => ({
  type: RESET_MASTER_CANCEL_TOKEN,
});

// reducer
const INITIAL_STATE = {
  access_token: getAuthTokenFromCookies(),
};
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
