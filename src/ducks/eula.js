import axios from 'axios';
import { API_URL } from '../constants';

const EULA_API_URL = `${API_URL}user/eula`;
const ACCEPT_EULA_API_URL = `${EULA_API_URL}/accept`;

// actions
const FETCH_EULA_SUCCESS = 'FETCH_EULA_SUCCESS'; 
const ACCEPT_EULA_SUCCESS = 'ACCEPT_EULA_SUCCESS';


// action creators

export const fetchEula = (config = {}) => (dispatch) => {
  return axios.get(EULA_API_URL, config)
    .then(({ data: { data } }) => {
      dispatch(fetchEulaSuccess(data));
    })
    .catch((error) => {
      const errorObject = JSON.parse(JSON.stringify(error));
      console.warn('error fetching EULA', errorObject);
    });
};

export const acceptEula = (body) => (dispatch) => { // body = { user, eula, accept }
  return axios.post(ACCEPT_EULA_API_URL, body)
    .then(({ data: { data } }) => {
      dispatch(acceptEulaSuccess(data));
    });
};


const fetchEulaSuccess = payload => ({
  type: FETCH_EULA_SUCCESS,
  payload,
});

const acceptEulaSuccess = payload => ({
  type: ACCEPT_EULA_SUCCESS,
  payload,
});


// reducers
const INITIAL_USER_STATE = {};
export default (state = INITIAL_USER_STATE, action = {}) => {
  const { type, payload } = action;
  
  switch (type) {
  case (FETCH_EULA_SUCCESS): {
    return payload;
  }
  default: {
    return state;
  }
  }
};
