import axios from 'axios';
import uniqBy from 'lodash/uniqBy';

import { API_URL } from '../constants';
import { getBboxParamsFromMap, recursivePaginatedQuery } from '../utils/query';
import { calcUrlForImage } from '../utils/img';

const EVENT_API_URL = `${API_URL}activity/events/`;

// actions
export const FETCH_EVENTS = 'FETCH_EVENTS';
export const FETCH_EVENTS_SUCCESS = 'FETCH_EVENTS_SUCCESS';
export const FETCH_EVENTS_NEXT_PAGE_SUCCESS = 'FETCH_EVENTS_NEXT_PAGE_SUCCESS';
export const FETCH_EVENTS_ERROR = 'FETCH_EVENTS_ERROR';

export const FETCH_MAP_EVENTS = 'FETCH_MAP_EVENTS';
export const FETCH_MAP_EVENTS_SUCCESS = 'FETCH_MAP_EVENTS_SUCCESS';
export const FETCH_MAP_EVENTS_ERROR = 'FETCH_MAP_EVENTS_ERROR';

export const SOCKET_NEW_EVENT = 'SOCKET_NEW_EVENT';
export const SOCKET_UPDATE_EVENT = 'SOCKET_UPDATE_EVENT';


// action creators
export const fetchEvents = (config = {}) => {
  return function (dispatch) {
    return axios.get(EVENT_API_URL, config)
      .then(response => dispatch(fetchEventsSucess(response)))
      .catch(error => dispatch(fetchEventsError(error)));
  };
};

export const fetchNextEventPage = (url, config = {}) => {
  return function (dispatch) {
    return axios.get(url, config)
      .then(response => dispatch(fetchEventsNextPageSucess(response)))
      .catch(error => dispatch(fetchEventsError(error)));
  };
};

export const fetchMapEvents = (map, { token }) => function (dispatch) {
  if (!map) return;

  const bbox = getBboxParamsFromMap(map);

  return recursivePaginatedQuery(axios.get(EVENT_API_URL, {
    cancelToken: token,
    params: {
      bbox,
    },
  }), [], token)
    .then((results) => {
      dispatch(fetchMapEventsSucess(results));
    })
    .catch((error) => {
      dispatch(fetchMapEventsError(error));
    });
}

const fetchEventsSucess = response => ({
  type: FETCH_EVENTS_SUCCESS,
  payload: response.data,
});

const fetchEventsNextPageSucess = response => ({
  type: FETCH_EVENTS_NEXT_PAGE_SUCCESS,
  payload: response.data,
});

const fetchEventsError = error => ({
  type: FETCH_EVENTS_ERROR,
  payload: error,
});

const fetchMapEventsSucess = results => ({
  type: FETCH_MAP_EVENTS_SUCCESS,
  payload: results,
});

const fetchMapEventsError = error => ({
  type: FETCH_MAP_EVENTS_ERROR,
  payload: error,
});

// reducers
const INITIAL_EVENTS_STATE = {
  count: null,
  next: null,
  previous: null,
  results: [],
};

export default function reducer(state = INITIAL_EVENTS_STATE, action = {}) {
  switch (action.type) {
    case FETCH_EVENTS_SUCCESS: {
      return action.payload.data;
    }
    case FETCH_EVENTS_NEXT_PAGE_SUCCESS: {
      const { payload: { data } } = action;
      const { results:events, count, next, previous } = data;
      return Object.assign({}, state, {
        count,
        next,
        previous,
        results: uniqBy([...state.results, ...events], 'id'),
      })
    }
    default: {
      return state;
    }
  }
};

const INITIAL_MAP_EVENTS_STATE = [];

export const mapEventsReducer = function mapEventsReducer(state = INITIAL_MAP_EVENTS_STATE, action = {}) {
  switch (action.type) {
    case FETCH_MAP_EVENTS_SUCCESS: {
      return action.payload;
    }
    case SOCKET_NEW_EVENT: {
      const { payload: { event_data } } = action;
      console.log('new event', event_data);
      event_data.geojson.properties.image = calcUrlForImage(event_data.geojson.properties.image);
      return [...state, event_data];
    }
    case SOCKET_UPDATE_EVENT: {
      const { payload: { event_data } } = action;
      console.log('event update', event_data);
      event_data.geojson.properties.image = calcUrlForImage(event_data.geojson.properties.image);
      return state.map((event) => {
        if (event.id === event_data.id) event = event_data;
        return event;
      });
    }
    default: {
      return state;
    }
  }
};