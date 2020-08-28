

import axios from 'axios';
import { API_URL } from '../constants';

const PATROL_TYPES_API_URL = `${API_URL}activity/patrols/types`;

const { get } = axios;

const FETCH_PATROL_TYPES_SUCCESS = 'FETCH_PATROL_TYPES_SUCCESS';

export const fetchPatrolTypes = () =>
  dispatch =>
    get(PATROL_TYPES_API_URL)
      .then(({  data: { data } }) =>
        dispatch({
          type: FETCH_PATROL_TYPES_SUCCESS,
          payload: data,
        })
      );


const INITIAL_PATROL_TYPES_STATE = [];

const patrolTypesReducer = (state = INITIAL_PATROL_TYPES_STATE, action = {}) => {
  if (action.type === FETCH_PATROL_TYPES_SUCCESS) {
    return action.payload;
  }
  return state;
};

export default patrolTypesReducer;