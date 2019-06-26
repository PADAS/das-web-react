import axios from 'axios';
import { API_URL } from '../constants';

export const ANALYZERS_API_URL = `${API_URL}analyzers/spatial?active=true`;

// actions
export const FETCH_ANALYZERS = 'FETCH_ANALYZERS';
export const FETCH_ANALYZERS_SUCCESS = 'FETCH_ANALYZERS_SUCCESS';
export const FETCH_ANALYZERS_ERROR = 'FETCH_ANALYZERS_ERROR';


// action creators
export const fetchAnalyzerss = () => {
  return function(dispatch) {
    return axios.get(MAPS_ANALYSERS_URL)
      .then((response) => {
        dispatch(fetchMapsSuccess(response));
      })
      .catch((error) => {
        dispatch(fetchMapsError(error));
      });
  }
};

const fetchAnalyzersSuccess = (response) => dispatch => {
  const analyzers = response.data.data;
  
  dispatch({
    type: FETCH_ANALYZERS_SUCCESS,
    payload: analyzers,
  });
} 

const fetchMapsError = (error) => ({
  type: FETCH_ANALYZERS_ERROR,
  payload: error,
});


// reducers
const INITIAL_ANALYZERS_STATE = [];
export default function ftchAnalyzerReducer(state = INITIAL_ANALYZERS_STATE, action = {}) {
  switch (action.type) {
    case FETCH_ANALYZERS_SUCCESS: {
      return action.payload;
    }
    case FETCH_ANALYZERS_ERROR: {
      return action.payload;
    }
    default: {
      return state;
    }
  }
};
