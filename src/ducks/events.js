import axios, { CancelToken } from 'axios';
import union from 'lodash/union';
import unionBy from 'lodash/unionBy';

import { API_URL } from '../constants';
import { getBboxParamsFromMap, recursivePaginatedQuery } from '../utils/query';
import { calcUrlForImage } from '../utils/img';
import { eventBelongsToCollection, calcEventFilterForRequest } from '../utils/events';

const EVENTS_API_URL = `${API_URL}activity/events/`;
const EVENT_API_URL = `${API_URL}activity/event/`;

// actions
const CREATE_EVENT_START = 'CREATE_EVENT_START';
const CREATE_EVENT_SUCCESS = 'CREATE_EVENT_SUCCESS';
const CREATE_EVENT_ERROR = 'CREATE_EVENT_ERROR';

const UPDATE_EVENT_START = 'UPDATE_EVENT_START';
const UPDATE_EVENT_SUCCESS = 'UPDATE_EVENT_SUCCESS';
const UPDATE_EVENT_ERROR = 'UPDATE_EVENT_ERROR';

const UPLOAD_EVENT_FILES_START = 'UPLOAD_EVENT_FILES_START';
const UPLOAD_EVENT_FILES_SUCCESS = 'UPLOAD_EVENT_FILES_SUCCESS';
const UPLOAD_EVENT_FILES_ERROR = 'UPLOAD_EVENT_FILES_ERROR';

const ADD_EVENT_NOTE_START = 'ADD_EVENT_NOTE_START';
const ADD_EVENT_NOTE_SUCCESS = 'ADD_EVENT_NOTE_SUCCESS';
const ADD_EVENT_NOTE_ERROR = 'ADD_EVENT_NOTE_ERROR';

export const FETCH_FEED_EVENTS_START = 'FETCH_FEED_EVENTS_START';
export const FETCH_FEED_EVENTS_SUCCESS = 'FETCH_FEED_EVENTS_SUCCESS';
export const FETCH_FEED_EVENTS_NEXT_PAGE_SUCCESS = 'FETCH_FEED_EVENTS_NEXT_PAGE_SUCCESS';
export const FETCH_FEED_EVENTS_ERROR = 'FETCH_EVENTS_EROR';

export const FETCH_MAP_EVENTS = 'FETCH_MAP_EVENTS';
export const FETCH_MAP_EVENTS_SUCCESS = 'FETCH_MAP_EVENTS_SUCCESS';
export const FETCH_MAP_EVENTS_ERROR = 'FETCH_MAP_EVENTS_ERROR';

const FETCH_MAP_EVENTS_PAGE_SUCCESS = 'FETCH_MAP_REVENTS_PAGE_SUCCESS';

export const SOCKET_NEW_EVENT = 'SOCKET_NEW_EVENT';
export const SOCKET_UPDATE_EVENT = 'SOCKET_UPDATE_EVENT';

export const UPDATE_EVENT_STORE = 'UPDATE_EVENT_STORE';

const EVENT_RELATIONSHIP_CREATED = 'EVENT_RELATIONSHIP_CREATED';

let eventFetchCancelToken = CancelToken.source();

// action creators
export const createEvent = event => (dispatch) => {
  dispatch({
    type: CREATE_EVENT_START,
    payload: event,
  });

  return axios.post(EVENTS_API_URL, event)
    .then((response) => {
      dispatch({
        type: CREATE_EVENT_SUCCESS,
        payload: response.data.data,
      });
      dispatch(updateEventStore(response.data.data));
      return response;
    })
    .catch((error) => {
      dispatch({
        type: CREATE_EVENT_ERROR,
        payload: error,
      });
      return Promise.reject(error);
    });
};

export const addNoteToEvent = (event_id, note) => (dispatch) => {
  dispatch({
    type: ADD_EVENT_NOTE_START,
    payload: note,
  });
  return axios.post(`${EVENT_API_URL}${event_id}/notes/`, note)
    .then((response) => {
      dispatch({
        type: ADD_EVENT_NOTE_SUCCESS,
        payload: response.data.data,
      });
      return response;
    })
    .catch((error) => {
      dispatch({
        type: ADD_EVENT_NOTE_ERROR,
        payload: error,
      });
      return Promise.reject(error);
    });
};

export const addEventToIncident = (event_id, incident_id) => (_dispatch) => axios.post(`${EVENT_API_URL}${incident_id}/relationships`, {
  type: 'contains',
  to_event_id: event_id,
});

export const fetchEvent = event_id => dispatch => axios.get(`${EVENT_API_URL}${event_id}`)
  .then((response) => {
    dispatch(updateEventStore(response.data.data));
    return response;
  });

export const deleteFileFromEvent = (event_id, file_id) => axios.delete(`${EVENT_API_URL}${event_id}/files/${file_id}`);

export const updateEvent = (event) => (dispatch) => {
  dispatch({
    type: UPDATE_EVENT_START,
    payload: event,
  });

  return axios.put(`${EVENT_API_URL}${event.id}`, event)
    .then((response) => {
      dispatch({
        type: UPDATE_EVENT_SUCCESS,
        payload: response.data.data,
      });
      dispatch(updateEventStore(response.data.data));
      return response;
    })
    .catch((error) => {
      dispatch({
        type: UPDATE_EVENT_ERROR,
        payload: error,
      });
      return Promise.reject(error);
    });
};

export const uploadEventFile = (event_id, file, progressHandler = (event) => console.log('report file upload update', event)) => (dispatch) => {
  const uploadUrl = `${EVENT_API_URL}${event_id}/files/`;

  dispatch({
    type: UPLOAD_EVENT_FILES_START,
    payload: {
      event_id,
      file,
    },
  });

  const form = new FormData();
  form.append('filecontent.file', file);

  return axios.post(uploadUrl, form, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress(event) {
      progressHandler(event);
    },
  }).then((response) => {
    dispatch({
      type: UPLOAD_EVENT_FILES_SUCCESS,
      payload: response.data.data,
    });
    return response;
  })
    .catch((error) => {
      dispatch({
        type: UPLOAD_EVENT_FILES_ERROR,
        payload: error,
      });
      return Promise.reject(error);
    });
};

export const fetchFeedEvents = (config = {}) => (dispatch) => {
  eventFetchCancelToken.cancel();
  eventFetchCancelToken = CancelToken.source();

  dispatch({
    type: FETCH_FEED_EVENTS_START,
  });

  const eventFilterParamString = calcEventFilterForRequest();

  return axios.get(`${EVENTS_API_URL}?${eventFilterParamString}`, {
    ...config,
    cancelToken: eventFetchCancelToken.token,
  })
    .then((response) => {
      dispatch(fetchFeedEventsSuccess(response));
      return response;
    })
    .catch((error) => {
      dispatch(fetchFeedEventsError(error));
      return error;
    });
};

export const fetchNextEventFeedPage = (url) => {
  return function (dispatch) {
    return axios.get(url)
      .then(response => dispatch(fetchFeedEventsNextPageSucess(response)))
      .catch(error => dispatch(fetchFeedEventsError(error)));
  };
};

export const fetchMapEvents = (map, { token }) => async (dispatch) => {
  if (!map) return;

  const bbox = getBboxParamsFromMap(map);

  const eventFilterParamString = calcEventFilterForRequest({ bbox });

  const onEachRequest = onePageOfResults => dispatch(fetchMapEventsPageSuccess(onePageOfResults));

  const request = axios.get(`${EVENTS_API_URL}?${eventFilterParamString}`, {
    cancelToken: token,
  });

  return recursivePaginatedQuery(request, token, onEachRequest)
    .then((finalResults) => {
      dispatch(fetchMapEventsSucess(finalResults));
    })
    .catch((error) => {
      dispatch(fetchMapEventsError(error));
    });
};

const fetchFeedEventsSuccess = response => (dispatch) => {
  dispatch({
    type: FETCH_FEED_EVENTS_SUCCESS,
    payload: response.data.data,
  });
  dispatch(updateEventStore(...response.data.data.results));
}; 

const fetchFeedEventsNextPageSucess = response => (dispatch) => {
  dispatch({
    type: FETCH_FEED_EVENTS_NEXT_PAGE_SUCCESS,
    payload: response.data.data,
  });
  dispatch(updateEventStore(...response.data.data.results));
};

const fetchFeedEventsError = error => ({
  type: FETCH_FEED_EVENTS_ERROR,
  payload: error,
});

const fetchMapEventsSucess = results => (dispatch) => {
  dispatch({
    type: FETCH_MAP_EVENTS_SUCCESS,
    payload: results,
  });
  dispatch(updateEventStore(...results));
}; 

const fetchMapEventsPageSuccess = results => (dispatch) => {
  dispatch({
    type: FETCH_MAP_EVENTS_PAGE_SUCCESS,
    payload: results,
  });
  dispatch(updateEventStore(...results));
}; 

const fetchMapEventsError = error => ({
  type: FETCH_MAP_EVENTS_ERROR,
  payload: error,
});

const updateEventStore = (...results) => ({
  type: UPDATE_EVENT_STORE,
  payload: results,
});

// reducers
const INITIAL_STORE_STATE = {};
export const eventStoreReducer = (state = INITIAL_STORE_STATE, { type, payload }) => {
  const SOCKET_EVENTS = [SOCKET_NEW_EVENT, SOCKET_UPDATE_EVENT];
  
  if (type === UPDATE_EVENT_STORE) {
    const toAdd = payload.reduce((accumulator, event) => {
      if (event.geojson) {
        event.geojson.properties.image = calcUrlForImage(event.geojson.properties.image);
      }

      accumulator[event.id] = { ...state[event.id], ...event };
      
      return accumulator;
    }, {});

    return {
      ...state,
      ...toAdd,
    };
  }
  if (SOCKET_EVENTS.includes(type)) {
    const { event_data } = payload;
    return {
      ...state,
      [event_data.id]: {
        ...state[event_data.id],
        ...event_data,
      },
    };
  }
  return state;
};

const INITIAL_EVENT_FEED_STATE = {
  count: null,
  next: null,
  previous: null,
  results: [],
};

export const eventFeedReducer = (state = INITIAL_EVENT_FEED_STATE, { type, payload }) => {
  if (type === FETCH_FEED_EVENTS_START) {
    return INITIAL_EVENT_FEED_STATE;
  }
  if (type === FETCH_FEED_EVENTS_SUCCESS) {
    return {
      ...payload,
      results: payload.results.map(event => event.id),
    };
  }
  if (type === FETCH_FEED_EVENTS_NEXT_PAGE_SUCCESS) {
    const { results: events, count, next, previous } = payload;
    return {
      ...state,
      count,
      next,
      previous,
      results: [...state.results, ...events.map(event => event.id)],
    };
  }
  if ([SOCKET_NEW_EVENT, SOCKET_UPDATE_EVENT].includes(type)) {
    const { event_data, event_id } = payload;
    if (eventBelongsToCollection(event_data)) return state.filter(id => id !== event_id);

    return {
      ...state,
      results: union([event_id], state.results),
    };
  }
  return state;
};

const INITIAL_MAP_EVENTS_STATE = [];
export const mapEventsReducer = function mapEventsReducer(state = INITIAL_MAP_EVENTS_STATE, { type, payload }) {
  const extractEventIDs = events => events.map(e => e.id);

  if (type === FETCH_MAP_EVENTS_PAGE_SUCCESS) {
    return union(extractEventIDs(payload), state);
  }
  if (type === FETCH_MAP_EVENTS_SUCCESS) {
    return extractEventIDs(payload);
  }
  if ([SOCKET_NEW_EVENT, SOCKET_UPDATE_EVENT].includes(type)) {
    const  { event_data, event_id } = payload;
    if (!event_data.geojson) return state;

    return union([event_id], state);
  }
  return state;
};

export default eventStoreReducer;