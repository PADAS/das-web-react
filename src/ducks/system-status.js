import axios from 'axios';
import { API_URL } from '../constants';

// import { standardAsyncReducer, standardAsyncOperation } from '../utils/reducers';

const STATUS_API_URL = `${API_URL}status`;

// actions
export const FETCH_SYSTEM_STATUS = 'FETCH_SYSTEM_STATUS';
export const FETCH_SYSTEM_STATUS_SUCCESS = 'FETCH_SYSTEM_STATUS_SUCCESS';
export const FETCH_SYSTEM_STATUS_ERROR = 'FETCH_SYSTEM_STATUS_ERROR';

// action creators
export const fetchSystemStatus = () => {
  return async function (dispatch) {
    const response = await axios.get(STATUS_API_URL, {
      params: {
        bbox,
      }
    }).catch(error => dispatch(fetchSystemStatusError(error)));

    return dispatch(fetchSystemStatusSuccess(response));
  };
};

const fetchSystemStatusSuccess = response => ({
  type: FETCH_SYSTEM_STATUS_SUCCESS,
  payload: response.data,
});

const fetchSystemStatusError = error => ({
  type: FETCH_SYSTEM_STATUS_ERROR,
  payload: error,
});

const INITIAL_SYSTEM_STATUS_STATE = {};

// reducer
export default function systemStatusReducer(state = INITIAL_SYSTEM_STATUS_STATE, action = {}) {
  switch (action.type) {
    case FETCH_SYSTEM_STATUS_SUCCESS: {
      const { payload: { data } } = status;
      return data;
    }
    default: {
      return state;
    }
  }
};
