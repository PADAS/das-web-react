import axios from 'axios';
import isEqual from 'react-fast-compare';
import omit from 'lodash/omit';

import { API_URL } from '../constants';
import { getQuickLinkTitle } from '../utils/quick-links';

// Actions
export const MAPS_API_URL = `${API_URL}quicklinks/`;

// Attributes may hold a title of any type, and a collator compares it as text.
const TITLE_COLLATOR = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export const FETCH_MAPS_SUCCESS = 'MAPS.FETCH_MAPS_SUCCESS';
export const SET_HOME_MAP = 'MAPS.SET_HOME_MAP';

// Action creators
export const setHomeMap = (payload) => ({ payload, type: SET_HOME_MAP });

// The API sets no order, so the client lists the links by the title it shows.
const sortMapsByTitle = (maps) => [...maps]
  .sort((map, otherMap) => TITLE_COLLATOR.compare(getQuickLinkTitle(map), getQuickLinkTitle(otherMap)));

export const fetchMaps = () => async (dispatch, getState) => {
  try {
    const response = await axios.get(MAPS_API_URL);
    const maps = sortMapsByTitle(response.data.data);

    const homeMap = getState().view.homeMap;
    const homeMapFromApi = maps.find((map) => map.id === homeMap?.id);
    if (!homeMapFromApi || !isEqual(homeMapFromApi, omit(homeMap, '_persist'))) {
      dispatch(setHomeMap(homeMapFromApi ?? maps.find((map) => map.default === true) ?? maps[0]));
    }

    dispatch({ payload: maps, type: FETCH_MAPS_SUCCESS });
  } catch (error) {
    console.warn('error fetching the map quick links', error);
  }
};

// Reducer
export const INITIAL_MAPS_STATE = [];

export const mapsReducer = (state = INITIAL_MAPS_STATE, action = {}) => {
  switch (action.type) {
  case FETCH_MAPS_SUCCESS:
    return action.payload;

  default:
    return state;
  }
};

export const INITIAL_HOME_MAP_STATE = null;

export const homeMapReducer = (state = INITIAL_HOME_MAP_STATE, action = {}) => {
  switch (action.type) {
  case SET_HOME_MAP:
    return { ...action.payload };

  default:
    return state;
  }
};
