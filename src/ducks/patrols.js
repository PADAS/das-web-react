import axios from 'axios';
import { REACT_APP_DAS_API_URL } from '../constants';

import globallyResettableReducer from '../reducers/global-resettable';

const PATROLS_API_URL = `${REACT_APP_DAS_API_URL}activity/patrols`;

const FETCH_PATROLS_SUCCESS = 'FETCH_PATROLS_SUCCESS';
const FETCH_PATROLS_ERROR = 'FETCH_PATROLS_ERROR';

export const fetchPatrols = () => async (dispatch) => {
  const { data:patrols } = await axios.get(PATROLS_API_URL).catch((error) => {
    console.warn('error fetching patrols', error);
    dispatch({
      type: FETCH_PATROLS_ERROR,
      payload: error,
    });
    return new Error(error);
  });
  dispatch({
    type: FETCH_PATROLS_SUCCESS,
    payload: patrols,
  });
  return patrols;
};

const INITIAL_PATROLS_STATE = {
  count: null,
  next: null,
  previous: null,
  results: [],
};

const patrolsReducer = (state = INITIAL_PATROLS_STATE, action) => {
  const { type, payload } = action;

  if (type === FETCH_PATROLS_SUCCESS) {
    console.log('FETCH_PATROLS_SUCCESS', payload);
    return payload;
  }
  
  return state;
};


export default globallyResettableReducer(patrolsReducer, INITIAL_PATROLS_STATE);