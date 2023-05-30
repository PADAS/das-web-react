import axios from 'axios';
import { combineReducers } from 'redux';

import { API_URL, DAS_HOST, SYSTEM_CONFIG_FLAGS, STATUSES, DEFAULT_SHOW_TRACK_DAYS } from '../constants';
import { endOfToday, generateDaysAgoDate } from '../utils/datetime';
import { setServerVersionAnalyticsDimension, setSitenameDimension } from '../utils/analytics';
import { setDefaultDateRange as setDefaultEventDateRange } from './event-filter';
import { setDefaultDateRange as setDefaultPatrolDateRange } from './patrol-filter';

export const STATUS_API_URL = `${API_URL}status`;

// actions
export const FETCH_SYSTEM_STATUS_SUCCESS = 'FETCH_SYSTEM_STATUS_SUCCESS';
const FETCH_SYSTEM_STATUS_ERROR = 'FETCH_SYSTEM_STATUS_ERROR';

const NETWORK_STATUS_CHANGE = 'NETWORK_STATUS_CHANGE';
const SERVER_VERSION_CHANGE = 'SERVER_VERSION_CHANGE';
const SERVER_STATUS_CHANGE = 'SERVER_STATUS_CHANGE';

export const SOCKET_HEALTHY_STATUS = 'SOCKET_HEALTHY_STATUS';
export const SOCKET_UNHEALTHY_STATUS = 'SOCKET_UNHEALTHY_STATUS';
export const SOCKET_WARNING_STATUS = 'SOCKET_WARNING_STATUS';
export const SOCKET_SERVICE_STATUS = 'SOCKET_SERVICE_STATUS';

export const SET_SYSTEM_CONFIG = 'SET_SYSTEM_CONFIG';

const { HEALTHY_STATUS, WARNING_STATUS, UNHEALTHY_STATUS, UNKNOWN_STATUS } = STATUSES;

// action creators
export const updateNetworkStatus = (status) => ({
  type: NETWORK_STATUS_CHANGE,
  payload: status,
});


const socketHealthStatusResolver = () => {
  let timeout;

  return status => dispatch => {
    window.clearTimeout(timeout);
    const dispatchStatus = () => dispatch({ type: status });

    if (status !== SOCKET_HEALTHY_STATUS) {
      timeout = window.setTimeout(dispatchStatus, 2000);
    } else {
      return dispatchStatus();
    }
  };

};

export const updateSocketHealthStatus = socketHealthStatusResolver();

export const fetchSystemStatus = () => (dispatch) => axios.get(STATUS_API_URL, {
  params: {
    service_status: true,
  },
})
  .then((response) => {
    dispatch(setSystemConfig(response));
    dispatch(fetchSystemStatusSuccess(response));
    return response.data.data;
  })
  .catch(error => {
    dispatch(fetchSystemStatusError(error));
  });

const setSystemConfig = ({ data: { data } }) => (dispatch) => {
  const sitename = data.site_name || window.location.hostname;
  setSitenameDimension(sitename);

  dispatch({
    type: SET_SYSTEM_CONFIG,
    payload: {
      [SYSTEM_CONFIG_FLAGS.ALERTS]: data[SYSTEM_CONFIG_FLAGS.ALERTS],
      [SYSTEM_CONFIG_FLAGS.DAILY_REPORT]: data[SYSTEM_CONFIG_FLAGS.DAILY_REPORT],
      [SYSTEM_CONFIG_FLAGS.EULA]: data[SYSTEM_CONFIG_FLAGS.EULA],
      // Change the following line to "true" to test the functionality of appending 'location' params to map event
      // requests
      [SYSTEM_CONFIG_FLAGS.GEOPERMISSIONS]: data?.geoPermissionsEnabled ?? false,
      [SYSTEM_CONFIG_FLAGS.KML_EXPORT]: data[SYSTEM_CONFIG_FLAGS.KML_EXPORT],
      [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: data[SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT],
      [SYSTEM_CONFIG_FLAGS.TABLEAU]: data[SYSTEM_CONFIG_FLAGS.TABLEAU],
      showTrackDays: data.show_track_days,
      sitename,
    },
  });

  if (data[SYSTEM_CONFIG_FLAGS.DEFAULT_EVENT_FILTER_FROM_DAYS]) {
    dispatch(setDefaultEventDateRange(
      generateDaysAgoDate(data[SYSTEM_CONFIG_FLAGS.DEFAULT_EVENT_FILTER_FROM_DAYS]).toISOString(),
      null
    ));
  }

  if (data[SYSTEM_CONFIG_FLAGS.DEFAULT_PATROL_FILTER_FROM_DAYS]) {
    dispatch(setDefaultPatrolDateRange(
      generateDaysAgoDate(data[SYSTEM_CONFIG_FLAGS.DEFAULT_PATROL_FILTER_FROM_DAYS]).toISOString(),
      endOfToday().toISOString()
    ));
  }
};

const fetchSystemStatusSuccess = ({ data: { data } }) => ({
  type: FETCH_SYSTEM_STATUS_SUCCESS,
  payload: data,
});

const fetchSystemStatusError = (error) => ({
  type: FETCH_SYSTEM_STATUS_ERROR,
  payload: error,
});

// utility functions
const createServiceModelsFromApiResponse = services => services.map(service => genericStatusModel({
  title: service.display_name,
  type: 'service',
  provider_key: service.provider_key,
  status: service.status_code === 'OK' ? HEALTHY_STATUS : service.status_code === 'WARNING' ? WARNING_STATUS : UNHEALTHY_STATUS,
  heartbeat: {
    title: service.heartbeat.title || 'system activity',
    timestamp: new Date(service.heartbeat.latest_at) || null,
  },
  datasource: {
    title: service.datasource.title || 'device activity',
    timestamp: new Date(service.datasource.latest_at) || null,
  },
}));

const genericStatusModel = (config = {}) => ({
  title: null,
  status: UNKNOWN_STATUS,
  details: null,
  ...config,
});

// reducers

// higher-order reducer for shared behavior
const genericStatusReducer = (reducer, onApiResponse = (update, state) => state) => (state, action) => {
  const { payload, type } = action;
  switch (type) {
  case FETCH_SYSTEM_STATUS_SUCCESS: {
    return onApiResponse(payload, state);
  }
  case FETCH_SYSTEM_STATUS_ERROR: {
    return {
      ...genericStatusModel({
        ...state,
        status: UNHEALTHY_STATUS,
      }),
    };
  }
  case NETWORK_STATUS_CHANGE: {
    if (payload === UNHEALTHY_STATUS) {
      if (Array.isArray(state)) {
        return state.map(item => ({ ...item, status: UNKNOWN_STATUS }));
      }
      return {
        ...state,
        status: UNKNOWN_STATUS,
      };
    } else {
      return reducer(state, action);
    }
  }
  default: {
    return reducer(state, action);
  }
  }
};

const INITIAL_NETWORK_STATUS_STATE = genericStatusModel({
  title: 'Network',
  details: window.navigator.onLine ? 'online' : 'offline',
  status: window.navigator.onLine ? HEALTHY_STATUS : UNHEALTHY_STATUS,
});
const networkStatusReducer = function (state = INITIAL_NETWORK_STATUS_STATE, { payload, type }) {
  switch (type) {
  case (NETWORK_STATUS_CHANGE): {
    return {
      ...state,
      details: payload === HEALTHY_STATUS ? 'online' : 'offline',
      status: payload,
    };
  }
  default: {
    return state;
  }
  }
};


const INITIAL_SERVER_STATUS_STATE = genericStatusModel({
  version: null,
});

const serverStatusReducer = genericStatusReducer((state = INITIAL_SERVER_STATUS_STATE, { type, payload }) => {
  switch (type) {
  case (SERVER_VERSION_CHANGE): {
    const { version } = payload;

    setServerVersionAnalyticsDimension(version);
    return {
      ...state,
      version,
      title: `EarthRanger Server ${version}`,
    };
  }
  case (NETWORK_STATUS_CHANGE): {
    if (payload === HEALTHY_STATUS) {
      return {
        ...state,
        status: HEALTHY_STATUS,
      };
    }
    return state;
  }
  case (SERVER_STATUS_CHANGE): {
    const { status } = payload;
    return {
      ...state,
      details: status === HEALTHY_STATUS ? 'online' : 'offline',
      status,
    };
  }
  default: {
    return state;
  }
  }
}, ({ version }) => {
  setServerVersionAnalyticsDimension(version);
  return {
    version: version,
    details: DAS_HOST || window.location.origin,
    status: HEALTHY_STATUS,
    title: `EarthRanger Server ${version}`,
  };
});

const INITIAL_REALTIME_STATUS_STATE = genericStatusModel({
  title: 'EarthRanger Realtime',
  details: 'Activity',
  timestamp: null,
});
const realtimeStatusReducer = genericStatusReducer((state = INITIAL_REALTIME_STATUS_STATE, { type, payload }) => {
  switch (type) {
  case (SOCKET_HEALTHY_STATUS): {
    const timestamp = new Date();

    return {
      ...state,
      status: HEALTHY_STATUS,
      timestamp,
    };
  }
  case (SERVER_STATUS_CHANGE): {
    if (payload === UNKNOWN_STATUS) {
      return {
        ...state,
        status: UNKNOWN_STATUS,
      };
    }
    return state;
  }
  case (SOCKET_UNHEALTHY_STATUS): {
    return {
      ...state,
      status: UNHEALTHY_STATUS,
    };
  }
  case (SOCKET_WARNING_STATUS): {
    return {
      ...state,
      status: WARNING_STATUS,
    };
  }
  default: {
    return state;
  }
  }
});

const INITIAL_SERVICES_STATUS_STATE = [];
const serviceStatusReducer = genericStatusReducer((state = INITIAL_SERVICES_STATUS_STATE, { type, payload }) => {
  switch (type) {
  case (SOCKET_SERVICE_STATUS): {
    const { services } = payload;
    return createServiceModelsFromApiResponse(services);
  }
  case (SERVER_STATUS_CHANGE): {
    if (payload === UNKNOWN_STATUS) {
      return state.map(service => ({ ...service, status: UNKNOWN_STATUS }));
    }
    return state;
  }
  default: {
    return state;
  }
  }
}, ({ services }) => createServiceModelsFromApiResponse(services));

// export the combined reducers as our system status reducer
export default combineReducers({
  network: networkStatusReducer,
  server: serverStatusReducer,
  realtime: realtimeStatusReducer,
  services: serviceStatusReducer,
});

const INITIAL_SYSTEM_CONFIG_STATE = {
  [SYSTEM_CONFIG_FLAGS.ALERTS]: false,
  [SYSTEM_CONFIG_FLAGS.DAILY_REPORT]: false,
  [SYSTEM_CONFIG_FLAGS.EULA]: false,
  [SYSTEM_CONFIG_FLAGS.GEOPERMISSIONS]: false,
  [SYSTEM_CONFIG_FLAGS.KML_EXPORT]: false,
  [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: false,
  showTrackDays: DEFAULT_SHOW_TRACK_DAYS,
  sitename: '',
};

export const systemConfigReducer = (state = INITIAL_SYSTEM_CONFIG_STATE, { type, payload }) => {
  if (type === SET_SYSTEM_CONFIG) {
    return { ...state, ...payload, };
  }
  return state;
};
