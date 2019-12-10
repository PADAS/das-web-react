import axios from 'axios';
import { store } from '../index';
import { clearAuth } from '../ducks/auth';
import { resetMasterCancelToken } from '../ducks/auth';
import { handleServerRequestError } from './request';

export const getAuthTokenFromCookies = () => {
  const token = document.cookie.split(' ').find(item => item.startsWith('token='));
  return token ? token.replace('token=', '').replace(';', '') : null;
};


const goToLoginPageOnAuthFailure = (error) => {
  if (error && error.response && error.response.data && error.response.data.status && error.response.data.status.code === 401) {
    store.dispatch(clearAuth());
    store.dispatch(resetMasterCancelToken());
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