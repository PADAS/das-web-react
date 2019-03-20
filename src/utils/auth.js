import axios from 'axios';
import { store } from '../index';
import { clearAuth } from '../ducks/auth';

const goToLoginPageOnAuthFailure = (error) => {
  if (error && error.response && error.response.data && error.response.data.status && error.response.data.status.code === 401) {
    store.dispatch(clearAuth());
    return error;
  }
};

export default () => {
  axios.interceptors.response.use(response => response, goToLoginPageOnAuthFailure);
};