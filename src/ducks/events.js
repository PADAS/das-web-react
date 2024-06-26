import axios, { CancelToken, isCancel } from 'axios';
import union from 'lodash/union';

import { API_URL } from '../constants';
import globallyResettableReducer from '../reducers/global-resettable';
import { getBboxParamsFromMap, recursivePaginatedQuery } from '../utils/query';
import { generateErrorMessageForRequest } from '../utils/request';
import { addNormalizingPropertiesToEventDataFromAPI, eventBelongsToCollection,
  uniqueEventIds, validateReportAgainstCurrentEventFilter } from '../utils/events';
import { userIsGeoPermissionRestricted } from '../utils/geo-perms';

import { calcEventFilterForRequest } from '../utils/event-filter';
import { calcLocationParamStringForUserLocationCoords } from '../utils/location';

export const EVENTS_API_URL = (
  process.env.REACT_APP_MOCK_EVENTS_API === 'true'
  && process.env.NODE_ENV === 'development'
) ? '/api/v1.0/activity/events/'
  : `${API_URL}activity/events`;
export const EVENT_API_URL = `${API_URL}activity/event/`;

// actions
const CLEAR_EVENT_DATA = 'CLEAR_EVENT_DATA';

const CREATE_EVENT_START = 'CREATE_EVENT_START';
const CREATE_EVENT_SUCCESS = 'CREATE_EVENT_SUCCESS';
const CREATE_EVENT_ERROR = 'CREATE_EVENT_ERROR';

const EVENTS_COUNT_INCREMENT = 'EVENTS_COUNT_INCREMENT';

const SET_EVENT_STATE_START = 'SET_EVENT_STATE_START';
const SET_EVENT_STATE_SUCCESS = 'SET_EVENT_STATE_SUCCESS';
const SET_EVENT_STATE_ERROR = 'SET_EVENT_STATE_ERROR';

export const UPDATE_EVENT_START = 'UPDATE_EVENT_START';
const UPDATE_EVENT_SUCCESS = 'UPDATE_EVENT_SUCCESS';
const UPDATE_EVENT_ERROR = 'UPDATE_EVENT_ERROR';
const REMOVE_EVENT_BY_ID = 'REMOVE_EVENT_BY_ID';

const UPLOAD_EVENT_FILES_START = 'UPLOAD_EVENT_FILES_START';
const UPLOAD_EVENT_FILES_SUCCESS = 'UPLOAD_EVENT_FILES_SUCCESS';
const UPLOAD_EVENT_FILES_ERROR = 'UPLOAD_EVENT_FILES_ERROR';

const ADD_EVENT_NOTE_START = 'ADD_EVENT_NOTE_START';
const ADD_EVENT_NOTE_SUCCESS = 'ADD_EVENT_NOTE_SUCCESS';
const ADD_EVENT_NOTE_ERROR = 'ADD_EVENT_NOTE_ERROR';

const EVENT_FEED_NAME = 'EVENT_FEED';
const INCIDENT_FEED_NAME = 'INCIDENT_FEED';

const FEED_FETCH_START = 'FEED_FETCH_START';
const FEED_FETCH_SUCCESS = 'FEED_FETCH_SUCCESS';
const FEED_FETCH_NEXT_PAGE_SUCCESS = 'FEED_FETCH_NEXT_PAGE_SUCCESS';
const FEED_FETCH_ERROR = 'FEED_FETCH_ERROR';

const FETCH_MAP_EVENTS_START = 'FETCH_MAP_EVENTS_START';
const FETCH_MAP_EVENTS_COMPLETE = 'FETCH_MAP_EVENTS_COMPLETE';
const FETCH_MAP_EVENTS_ERROR = 'FETCH_MAP_EVENTS_ERROR';
const FETCH_MAP_EVENTS_PAGE_SUCCESS = 'FETCH_MAP_EVENTS_PAGE_SUCCESS';

const NEW_EVENT_TYPE = 'new_event';
export const SOCKET_EVENT_DATA = 'SOCKET_EVENT_DATA';
const UPDATE_EVENT_STORE = 'UPDATE_EVENT_STORE';

const shouldAppendLocationToRequest = (state) => {
  const currentUser = state?.data?.selectedUserProfile?.username
    ? state?.data?.selectedUserProfile
    : state?.data?.user;
  return userIsGeoPermissionRestricted(currentUser) && !!state?.view?.userLocation?.coords;
};

export const socketEventData = (payload) => (dispatch) => {
  const { count, event_id, event_data, matches_current_filter, type } = payload;

  if (!matches_current_filter) {
    dispatch({
      type: REMOVE_EVENT_BY_ID,
      payload: event_id,
    });
  } else {
    dispatch({
      type: SOCKET_EVENT_DATA,
      payload: {
        count,
        event_data
      },
    });
  }

  if (validateReportAgainstCurrentEventFilter(event_data) && type === NEW_EVENT_TYPE) {
    dispatch({
      type: EVENTS_COUNT_INCREMENT
    });
  }

  dispatch({
    type: UPDATE_EVENT_STORE,
    payload: [event_data],
  });
};


// higher-order action creators
const fetchNamedFeedActionCreator = (name) => {
  let cancelToken = CancelToken.source();

  const fetchFn = (config, paramString) => (dispatch, getState) => {
    const state = getState();

    cancelToken.cancel();
    cancelToken = CancelToken.source();

    dispatch({
      name,
      type: FEED_FETCH_START,
    });

    if (shouldAppendLocationToRequest(state)) {
      paramString = paramString + `&location=${calcLocationParamStringForUserLocationCoords(state.view.userLocation.coords)}`;
    }


    return axios.get(`${EVENTS_API_URL}?${paramString}`, {
      ...config,
      cancelToken: cancelToken.token,
    })
      .then((response) => {
        if (typeof response !== 'undefined') { /* response === undefined for canceled requests. it's not an error, but it's a no-op for state management */
          dispatch(updateEventStore(...response.data.data.results));

          if (
            !response.data.data.results.length
          || (validateReportAgainstCurrentEventFilter(response.data.data.results[0], { getState })) /* extra layer of validation for async query race condition edge cases */
          ) {
          }
          dispatch({
            name,
            type: FEED_FETCH_SUCCESS,
            payload: response.data.data,
          });
        }
        return response;
      })
      .catch((error) => {
        dispatch({
          name,
          type: FEED_FETCH_ERROR,
          payload: error,
        });
        return Promise.reject(error);
      });
  };

  const fetchNextPageFn = url => dispatch => {
    cancelToken.cancel();
    cancelToken = CancelToken.source();

    return axios.get(url, {
      cancelToken: cancelToken.token,
    })
      .then(response => {
        dispatch(updateEventStore(...response.data.data.results));
        dispatch({
          name,
          type: FEED_FETCH_NEXT_PAGE_SUCCESS,
          payload: response.data.data,
        });
        return response;
      })
      .catch((error) => {
        dispatch({
          name,
          type: FEED_FETCH_ERROR,
          payload: error,
        });
        return Promise.reject(error);
      });
  };

  return [fetchFn, fetchNextPageFn, cancelToken];
};



// action creators
export const clearEventData = () => ({
  type: CLEAR_EVENT_DATA,
});

export const createEvent = event => (dispatch, getState) => {
  const params = {};
  const state = getState();

  if (shouldAppendLocationToRequest(state)) {
    params.location = calcLocationParamStringForUserLocationCoords(state.view.userLocation.coords);
  }

  dispatch({
    type: CREATE_EVENT_START,
    payload: event,
  });

  return axios.post(EVENTS_API_URL, event, { params })
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

export const addNoteToEvent = (event_id, note) => (dispatch, getState) => {
  const params = {};
  const state = getState();

  if (shouldAppendLocationToRequest(state)) {
    params.location = calcLocationParamStringForUserLocationCoords(state.view.userLocation.coords);
  }

  dispatch({
    type: ADD_EVENT_NOTE_START,
    payload: note,
  });
  return axios.post(`${EVENT_API_URL}${event_id}/notes/`, note, { params })
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

export const addEventToIncident = (event_id, incident_id) => (_dispatch, getState) => {
  const params = {};
  const state = getState();

  if (shouldAppendLocationToRequest(state)) {
    params.location = calcLocationParamStringForUserLocationCoords(state.view.userLocation.coords);
  }

  return axios.post(`${EVENT_API_URL}${incident_id}/relationships`, {
    type: 'contains',
    to_event_id: event_id,
  }, { params });
};

export const fetchEvent = (event_id, parameters = {}) =>
  (dispatch, getState) => {
    const state = getState();
    const params = { ...parameters };

    if (shouldAppendLocationToRequest(state)) {
      params.location = calcLocationParamStringForUserLocationCoords(state.view.userLocation.coords);
    }

    return axios.get(`${EVENT_API_URL}${event_id}`, {
      params,
    })
      .then((response) => {
        dispatch(updateEventStore(response.data.data));
        return response;
      });
  };

export const updateEvent = (event) => (dispatch, getState) => {
  const params = {};
  const state = getState();

  if (shouldAppendLocationToRequest(state)) {
    params.location = calcLocationParamStringForUserLocationCoords(state.view.userLocation.coords);
  }

  dispatch({
    type: UPDATE_EVENT_START,
    payload: event,
  });

  let eventResults;
  let resp;

  return axios.patch(`${EVENT_API_URL}${event.id}`, event, { params })
    .then((response) => {
      eventResults = response.data.data;
      resp = response;
      return Promise.resolve(validateReportAgainstCurrentEventFilter(eventResults));
    })
    .then((matchesEventFilter) => {
      if (!matchesEventFilter) {
        dispatch({
          type: REMOVE_EVENT_BY_ID,
          payload: event.id,
        });
      } else {
        dispatch({
          type: UPDATE_EVENT_SUCCESS,
          payload: eventResults,
        });
      }
      dispatch(updateEventStore(eventResults));
      return resp;
    })
    .catch((error) => {
      dispatch({
        type: UPDATE_EVENT_ERROR,
        payload: error,
      });
      return Promise.reject(error);
    });
};

export const setEventState = (id, state) => (dispatch, getState) => {
  const params = {};
  const store = getState();

  if (shouldAppendLocationToRequest(store)) {
    params.location = calcLocationParamStringForUserLocationCoords(store.view.userLocation.coords);
  }

  dispatch({
    type: SET_EVENT_STATE_START,
  });

  return axios.patch(`${EVENT_API_URL}${id}/state`, {
    state,
  }, { params })
    .then((response) => {
      dispatch({
        type: SET_EVENT_STATE_SUCCESS,
        payload: response.data.data,
      });
      // dispatch(updateEventStore(response.data.data));
      return response;
    })
    .catch((error) => {
      dispatch({
        type: SET_EVENT_STATE_ERROR,
        payload: error,
      });
      return Promise.reject(error);
    });
};

export const uploadEventFile = (event_id, file) => (dispatch, getState) => {
  const uploadUrl = `${EVENT_API_URL}${event_id}/files/`;
  const params = {};
  const state = getState();

  if (shouldAppendLocationToRequest(state)) {
    params.location = calcLocationParamStringForUserLocationCoords(state.view.userLocation.coords);
  }

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
    params,
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

const [fetchEventFeed, fetchNextEventFeedPage, fetchEventFeedCancelToken] = fetchNamedFeedActionCreator(EVENT_FEED_NAME);
const [fetchIncidentFeed, fetchNextIncidentFeedPage] = fetchNamedFeedActionCreator(INCIDENT_FEED_NAME);

export { fetchEventFeed, fetchEventFeedCancelToken, fetchNextEventFeedPage, fetchIncidentFeed, fetchNextIncidentFeedPage };

const generateNewCancelToken = () => new CancelToken(function executor(cancelFn) {
  mapEventsCancelFn = cancelFn;
});

let mapEventsCancelFn;

export const cancelMapEventsFetch = () => {
  if (mapEventsCancelFn) {
    mapEventsCancelFn();
  }
};

export const fetchMapEvents = (map, parameters) => async (dispatch, getState) => {
  const state = getState();

  let lastKnownBbox;
  if (!map) {
    lastKnownBbox = state?.data?.mapEvents?.bbox;
  }
  if (!map && !lastKnownBbox) return Promise.reject('no map available');

  const bbox = map ? await getBboxParamsFromMap(map) : lastKnownBbox;
  const params = { bbox, page_size: 25, ...parameters, include_updates: false };

  if (shouldAppendLocationToRequest(state)) {
    params.location = calcLocationParamStringForUserLocationCoords(state.view.userLocation.coords);
  }

  const eventFilterParamString = calcEventFilterForRequest({ params });

  cancelMapEventsFetch();

  dispatch({
    type: FETCH_MAP_EVENTS_START,
    payload: { bbox },
  });

  let resultsToDate = [];
  const onEachRequest = onePageOfResults => {
    resultsToDate = [...resultsToDate, ...onePageOfResults];
    dispatch(fetchMapEventsPageSuccess(onePageOfResults));
  };

  const request = axios.get(`${EVENTS_API_URL}?${eventFilterParamString}`, {
    cancelToken: generateNewCancelToken(),
  });


  return recursivePaginatedQuery(request, onEachRequest)
    .then((finalResults) => {
      finalResults && dispatch(fetchMapEventsComplete(finalResults));
    })
    .catch((error) => {
      dispatch(fetchMapEventsError(error));

      if (isCancel(error)) {
        dispatch(fetchMapEventsComplete([]));
      } else {
        dispatch(fetchMapEventsComplete(resultsToDate));
      }

      return Promise.reject(error);
    });
};

const fetchMapEventsComplete = results => (dispatch) => {
  dispatch({
    type: FETCH_MAP_EVENTS_COMPLETE,
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


// higher-order reducers
const namedFeedReducer = (name, reducer = state => state) => globallyResettableReducer((state, action) => {
  const isInitializationCall = state === undefined;
  if (isInitializationCall) return state;

  const { type, payload } = action;

  if (type === CLEAR_EVENT_DATA) {
    return { ...INITIAL_EVENT_FEED_STATE };
  }

  if (type === EVENTS_COUNT_INCREMENT) {
    return reducer(state, action);
  }

  /* socket changes and event updates should affect all feeds */
  if (
    type === UPDATE_EVENT_SUCCESS ||
    type === SOCKET_EVENT_DATA
  ) {

    const id =
      (type === UPDATE_EVENT_SUCCESS)
        ? payload.id
        : payload.event_data.id;

    const stateUpdate = {
      ...state,
      results: union([id], state.results),
    };

    return reducer(stateUpdate, action);
  }

  if (type === REMOVE_EVENT_BY_ID) {
    return {
      ...state,
      results: state.results.filter(id => id !== payload),
    };
  }

  if (name !== action.name) return state;

  if (type === FEED_FETCH_SUCCESS

  ) {
    return {
      ...payload,
      results: payload.results.map(event => event.id),
    };
  }
  if (type === FEED_FETCH_ERROR) {
    return isCancel(payload) ? state : {
      ...state,
      error: generateErrorMessageForRequest(payload),
    };
  }
  if (type === FEED_FETCH_NEXT_PAGE_SUCCESS) {
    const { results: events, count, next, previous } = payload;
    return {
      ...state,
      count,
      next,
      previous,
      results: [...state.results, ...events.map(event => event.id)].filter( uniqueEventIds ),
    };
  }

  return reducer(state, action);
}, INITIAL_EVENT_FEED_STATE);

// reducers
const INITIAL_STORE_STATE = {};
export const eventStoreReducer = (state, { type, payload }) => {
  if (type === CLEAR_EVENT_DATA) {
    return { ...INITIAL_STORE_STATE };
  }

  if (type === UPDATE_EVENT_STORE) {
    const toAdd = payload.reduce((accumulator, event) => {
      addNormalizingPropertiesToEventDataFromAPI(event);

      accumulator[event.id] = { ...state[event.id], ...event };

      if (event?.is_contained_in?.length) {
        const incidentsToUpdate = event.is_contained_in
          .map(({ related_event: { id } }) => state[id])
          .filter(item => !!item);
        incidentsToUpdate.forEach(incident => {
          const toMerge = !!accumulator[incident.id] ? accumulator[incident.id] : incident;

          accumulator[incident.id] = {
            ...toMerge,
            contains: toMerge.contains.map(item => {
              if (item.related_event.id !== event.id) return item;
              return {
                ...item,
                related_event: {
                  ...item.related_event, ...event,
                },
              };
            }),
          };
        });
      }



      return accumulator;
    }, {});

    return {
      ...state,
      ...toAdd,
    };
  }
  return state;
};

export const INITIAL_EVENT_FEED_STATE = {
  count: null,
  error: null,
  next: null,
  previous: null,
  results: [],
};

export const eventFeedReducer = namedFeedReducer(EVENT_FEED_NAME, (state, { type, payload }) => {
  if (type === SOCKET_EVENT_DATA) {
    if (eventBelongsToCollection(payload.event_data)) {
      return {
        ...state,
        results: state.results.filter(id => id !== payload.event_data.id),
      };
    }
  } else if (type === EVENTS_COUNT_INCREMENT) {
    return {
      ...state,
      count: state.count + 1
    };
  }
  return state;
});

export const incidentFeedReducer = namedFeedReducer(INCIDENT_FEED_NAME, (state, { type, payload }) => {
  if (type === SOCKET_EVENT_DATA) {

    if (!payload.event_data.is_collection) {
      return {
        ...state,
        results: state.results.filter(id => id !== payload.event_data.id),
      };
    }
  }
  return state;
});


// const INITIAL_MAP_EVENTS_STATE = [];

const INITIAL_MAP_EVENTS_STATE = {
  bbox: null,
  events: [],
};

export const mapEventsReducer = globallyResettableReducer((state, { type, payload }) => {
  const extractEventIDs = events => events.map(e => e.id);

  if (type === CLEAR_EVENT_DATA) {
    return { ...INITIAL_MAP_EVENTS_STATE };
  }

  if (type === FETCH_MAP_EVENTS_START) {
    const { bbox } = payload;
    return {
      ...state,
      bbox,
    };
  }
  if (type === FETCH_MAP_EVENTS_PAGE_SUCCESS) {
    return {
      ...state,
      events: union(extractEventIDs(payload), state.events),
    };
  }
  if (type === FETCH_MAP_EVENTS_COMPLETE) {
    return {
      ...state,
      events: extractEventIDs(payload),
    };
  }
  if (type === REMOVE_EVENT_BY_ID) {
    return {
      ...state,
      events: state.events.filter(id => id !== payload),
    };
  }
  if (type === SOCKET_EVENT_DATA) {
    if (!payload.event_data.geojson || !payload.event_data.geojson.geometry) return state;

    return {
      ...state,
      events: union([payload.event_data.id], state.events),
    };
  }
  return state;
}, INITIAL_MAP_EVENTS_STATE);

export default globallyResettableReducer(eventStoreReducer, INITIAL_STORE_STATE);