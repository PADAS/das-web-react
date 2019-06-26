import axios, { CancelToken } from 'axios';
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

export const FETCH_EVENTS_START = 'FETCH_EVENTS_START';
export const FETCH_EVENTS_SUCCESS = 'FETCH_EVENTS_SUCCESS';
export const FETCH_EVENTS_NEXT_PAGE_SUCCESS = 'FETCH_EVENTS_NEXT_PAGE_SUCCESS';
export const FETCH_EVENTS_ERROR = 'FETCH_EVENTS_EROR';

export const FETCH_MAP_EVENTS = 'FETCH_MAP_EVENTS';
export const FETCH_MAP_EVENTS_SUCCESS = 'FETCH_MAP_EVENTS_SUCCESS';
export const FETCH_MAP_EVENTS_ERROR = 'FETCH_MAP_EVENTS_ERROR';

const FETCH_MAP_EVENTS_PAGE_SUCCESS = 'FETCH_MAP_REVENTS_PAGE_SUCCESS';

export const SOCKET_NEW_EVENT = 'SOCKET_NEW_EVENT';
export const SOCKET_UPDATE_EVENT = 'SOCKET_UPDATE_EVENT';

export const UPDATE_EVENT_STORE = 'UPDATE_EVENT_STORE';

let eventFetchCancelToken = CancelToken.source();

// action creators
export const createEvent = (event) => (dispatch) => {
  dispatch({
    type: CREATE_EVENT_START,
    payload: event,
  });

  return axios.post(EVENTS_API_URL, event)
    .then(response => {
      dispatch({
        type: CREATE_EVENT_SUCCESS,
        payload: response.data.data,
      });
      dispatch(updateEventStore(response.data.data));
      return response;
    })
    .catch(error => {
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

export const fetchEvents = (config = {}) => (dispatch) => {
  eventFetchCancelToken.cancel();
  eventFetchCancelToken = CancelToken.source();

  dispatch({
    type: FETCH_EVENTS_START,
  });

  const eventFilterParamString = calcEventFilterForRequest();

  return axios.get(`${EVENTS_API_URL}?${eventFilterParamString}`, {
    ...config,
    cancelToken: eventFetchCancelToken.token,
  })
    .then(response => {
      dispatch(fetchEventsSuccess(response));
      return response;
    })
    .catch(error => dispatch(fetchEventsError(error)));
};

export const fetchNextEventPage = (url) => {
  return function (dispatch) {
    return axios.get(url)
      .then(response => dispatch(fetchEventsNextPageSucess(response)))
      .catch(error => dispatch(fetchEventsError(error)));
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



const fetchEventsSuccess = response => (dispatch) => {
  dispatch({
    type: FETCH_EVENTS_SUCCESS,
    payload: response.data,
  });
  dispatch(updateEventStore(...response.data.data.results));
}; 

const fetchEventsNextPageSucess = response => (dispatch) => {
  dispatch({
    type: FETCH_EVENTS_NEXT_PAGE_SUCCESS,
    payload: response.data,
  });
  dispatch(updateEventStore(...response.data.data.results));
};

const fetchEventsError = error => ({
  type: FETCH_EVENTS_ERROR,
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

const INITIAL_EVENTS_STATE = {
  count: null,
  next: null,
  previous: null,
  results: [],
};
export default function reducer(state = INITIAL_EVENTS_STATE, action = {}) {
  switch (action.type) {
  case FETCH_EVENTS_START: {
    return INITIAL_EVENTS_STATE;
  }
  case FETCH_EVENTS_SUCCESS: {
    return action.payload.data;
  }
  case FETCH_EVENTS_NEXT_PAGE_SUCCESS: {
    const { payload: { data } } = action;
    const { results: events, count, next, previous } = data;
    return {
      ...state,
      count,
      next,
      previous,
      results: [...state.results, ...events],
    };
  }
  case SOCKET_NEW_EVENT: {
    const { payload: { event_data } } = action;
    console.log('realtime: new event', event_data);
    if (eventBelongsToCollection(event_data)) return state;

    if (event_data.geojson) {
      event_data.geojson.properties.image = calcUrlForImage(event_data.geojson.properties.image);
    }
    return {
      ...state,
      results: [event_data, ...state.results],
    };
  }
  case SOCKET_UPDATE_EVENT: {
    const { payload: { event_data, event_id } } = action;
    console.log('realtime: event update', event_data);

    if (eventBelongsToCollection(event_data)) return state;

    if (!state.results.find(item => item.id === event_id)) return state;

    if (event_data.geojson) {
      event_data.geojson.properties.image = calcUrlForImage(event_data.geojson.properties.image);
    }

    return {
      ...state,
      results: unionBy([event_data], state.results, 'id'),
    };
  }
  default: {
    return state;
  }
  }
};



const INITIAL_MAP_EVENTS_STATE = [];

export const mapEventsReducer = function mapEventsReducer(state = INITIAL_MAP_EVENTS_STATE, action = {}) {
  switch (action.type) {
  case FETCH_MAP_EVENTS_PAGE_SUCCESS: {
    return unionBy(action.payload, state, 'id');
  }
  case FETCH_MAP_EVENTS_SUCCESS: {
    return action.payload;
  }
  case SOCKET_NEW_EVENT: {
    const { payload: { event_data } } = action;
    if (!event_data.geojson) return state;

    event_data.geojson.properties.image = calcUrlForImage(event_data.geojson.properties.image);
    return [...state, event_data];
  }
  case SOCKET_UPDATE_EVENT: {
    const { payload: { event_data, event_id } } = action;

    if (!event_data.geojson) return state;
    if (!state.find(item => item.id === event_id)) return state;

    event_data.geojson.properties.image = calcUrlForImage(event_data.geojson.properties.image);
    return unionBy([event_data], state, 'id');
  }
  default: {
    return state;
  }
  }
};