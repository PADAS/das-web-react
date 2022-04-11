import axios from 'axios';
import isEqual from 'react-fast-compare';

import { API_URL } from '../constants';
export const MAPS_API_URL = `${API_URL}maps/`;

// actions
export const FETCH_MAPS = 'FETCH_MAPS';
export const FETCH_MAPS_SUCCESS = 'FETCH_MAPS_SUCCESS';
export const FETCH_MAPS_ERROR = 'FETCH_MAPS_ERROR';
export const SET_HOME_MAP = 'SET_HOME_MAP';

// action creators
export const fetchMaps = () => dispatch => axios.get(MAPS_API_URL)
  .then((response) => {
    dispatch(fetchMapsSuccess(response));
  });


export const setHomeMap = (payload) => ({
  type: SET_HOME_MAP,
  payload,
});


const setHomeMapIfNecessary = (maps) => (dispatch, getState) => {
  const { view: { homeMap } } = getState();
  const defaultMap = maps.find(map => map.default === true) || maps[0];

  if (!homeMap?.id) {
    return dispatch(setHomeMap(defaultMap));
  }

  const homeMapClone = { ...homeMap };
  const homeMapFromApi = maps.find(map => map.id === homeMapClone.id);

  delete homeMapClone._persist;

  if (isEqual(homeMapFromApi, homeMapClone)) return;
  return dispatch(setHomeMap(homeMapFromApi || defaultMap));
};


const fetchMapsSuccess = (response) => dispatch => {
  const maps = response.data.data;

  dispatch(setHomeMapIfNecessary(maps));

  dispatch({
    type: FETCH_MAPS_SUCCESS,
    payload: maps,
  });
};



// reducers
const INITIAL_MAPS_STATE = [];
export default function reducer(state = INITIAL_MAPS_STATE, action = {}) {
  switch (action.type) {
  case FETCH_MAPS_SUCCESS: {
    return action.payload;
  }
  default: {
    return state;
  }
  }
};

const INITIAL_HOME_MAP_STATE = null;
export const homeMapReducer = function homeMapReducer(state = INITIAL_HOME_MAP_STATE, action = {}) {
  switch (action.type) {
  case SET_HOME_MAP: {
    return { ...action.payload };
  }
  default: {
    return state;
  }
  }
};
