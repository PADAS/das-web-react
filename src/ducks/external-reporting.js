import axios from 'axios';
import { API_URL } from '../constants';

import globallyResettableReducer from '../reducers/global-resettable';

const EXTERNAL_REPORTING_API_URL = `${API_URL}reports/`;

const FETCH_TABLEAU_DASHBOARD_START = 'FETCH_TABLEAU_DASHBOARD_START';
const FETCH_TABLEAU_DASHBOARD_SUCCESS = 'FETCH_TABLEAU_DASHBOARD_SUCCESS';
const FETCH_TABLEAU_DASHBOARD_ERROR = 'FETCH_TABLEAU_DASHBOARD_ERROR';

export const fetchTableauDashboard = () => async (dispatch) => {
  dispatch({
    type: FETCH_TABLEAU_DASHBOARD_START
  });

  const { data: { data } } = await axios.get(`${EXTERNAL_REPORTING_API_URL}tableau-dashboards/default`).catch((error) => {
    console.warn('error fetching patrols', error);
    dispatch({
      type: FETCH_TABLEAU_DASHBOARD_ERROR,
      payload: error,
    });
    return new Error(error);
  });
  dispatch({
    type: FETCH_TABLEAU_DASHBOARD_SUCCESS,
    payload: data,
  });
  return data;
};

const INITIAL_EXTERNAL_REPORTING_STATE = {
  tableauDashboard: {}
};

const externalReportingReducer = (state = INITIAL_EXTERNAL_REPORTING_STATE, action) => {
  const { type, payload } = action;

  if (type === FETCH_TABLEAU_DASHBOARD_START) {
    return {
      ...state,
      isFetching: true
    };
  }

  if (type === FETCH_TABLEAU_DASHBOARD_SUCCESS) {
    return {
      ...state,
      isFetching: false,
      tableauDashboard: payload
    };
  }

  if (type === FETCH_TABLEAU_DASHBOARD_ERROR) {
    return {
      ...state,
      isFetching: false,
      tableauDashboard: null
    };
  }
  
  return state;
};


export default globallyResettableReducer(externalReportingReducer, INITIAL_EXTERNAL_REPORTING_STATE);