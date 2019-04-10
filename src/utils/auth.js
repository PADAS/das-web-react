import axios from 'axios';
import { store } from '../index';
import { clearAuth } from '../ducks/auth';

const goToLoginPageOnAuthFailure = (error) => {
  if (error && error.response && error.response.data && error.response.data.status && error.response.data.status.code === 401) {
    store.dispatch(clearAuth());
    return error;
  }
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

export default () => {
  axios.interceptors.request.use(addUserProfileHeaderIfNecessary);
  axios.interceptors.response.use(response => response, goToLoginPageOnAuthFailure);

};