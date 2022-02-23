

import axios from 'axios';
import { API_URL } from '../constants';

const OBSERVATIONS_API_URL = `${API_URL}observations`;

const { get } = axios;

const FETCH_OBSERVATIONS_FOR_SUBJECT_SUCCESS = 'FETCH_OBSERVATIONS_FOR_SUBJECT_SUCCESS';

export const fetchObservationsForSubject = (subjectID, params = {}) =>
  dispatch =>
    get(OBSERVATIONS_API_URL, { params: { subject_id: subjectID, include_details: true, ...params } })
      .then(({  data: { data } }) => {
        dispatch({
          type: FETCH_OBSERVATIONS_FOR_SUBJECT_SUCCESS,
          payload: data,
        });
        return data;
      }
      );


const INITIAL_OBSERVATIONS_STATE = [];

const observationsReducer = (state = INITIAL_OBSERVATIONS_STATE, action = {}) => {
  if (action.type === FETCH_OBSERVATIONS_FOR_SUBJECT_SUCCESS) {
    return action.payload;
  }
  return state;
};

export default observationsReducer;