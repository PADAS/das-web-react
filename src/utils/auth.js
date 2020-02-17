import axios from 'axios';
import { store } from '../index';
import { clearAuth } from '../ducks/auth';
import { resetMasterCancelToken } from '../ducks/auth';

import { REACT_APP_ROUTE_PREFIX } from '../constants';


// import { handleServerRequestError } from './request';

export const getAuthTokenFromCookies = () => {
  const token = document.cookie.split(' ').find(item => item.startsWith('token='));
  return token ? token.replace('token=', '').replace(';', '') : null;
};

export const getTemporaryAccessTokenFromCookies = () => {
  const token = document.cookie.split(' ').find(item => item.startsWith('temporaryAccessToken='));
  return token ? token.replace('temporaryAccessToken=', '').replace(';', '') : null;
};

export const deleteAuthTokenCookie = () => {
  document.cookie = 'token=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};


const goToLoginPageOnAuthFailure = (error) => {
  if (error && error.toString().includes('401')) {
    store.dispatch(clearAuth());
    store.dispatch(resetMasterCancelToken());
    window.location = REACT_APP_ROUTE_PREFIX === '/' ? `${REACT_APP_ROUTE_PREFIX}login` : `${REACT_APP_ROUTE_PREFIX}/login`;
  }
  /* if (error) {
    handleServerRequestError(error);
  } */
  return Promise.reject(error);
};

const nonDefaultProfileSelected = () => {
  const { data: { selectedUserProfile, user } } = store.getState();
  return (selectedUserProfile && selectedUserProfile.id)
    && (user && user.id)
    && (selectedUserProfile.id !== user.id)
    && selectedUserProfile.id;
};

const addUserProfileHeaderIfNecessary = (config) => {
  const profile = nonDefaultProfileSelected();
  if (!config.url.includes('/user/me') && profile) {
    config.headers['USER-PROFILE'] = profile;
  }
  return config;
};

const addMasterCancelTokenForRequests = (config) => ({
  ...config,
  cancelToken: config.cancelToken || store.getState().data.masterRequestCancelToken.token,
});

export default () => {
  axios.interceptors.request.use(addMasterCancelTokenForRequests);
  axios.interceptors.request.use(addUserProfileHeaderIfNecessary);
  axios.interceptors.response.use(response => response, goToLoginPageOnAuthFailure);

};