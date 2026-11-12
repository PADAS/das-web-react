import axios from 'axios';
import { combineReducers } from 'redux';

import { API_URL, DAS_HOST, STATUSES } from '../constants';
import { setServerVersionAnalyticsDimension } from '../utils/analytics';
import { SET_SYSTEM_CONFIG, setSystemConfigFromSystemStatus } from './system-config';

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

// An anonymous request sends no login token. Its response can still carry a
// Django admin session's settings, so it never sets Tableau or Otus.
export const fetchSystemStatus = ({ anonymous = false } = {}) => async (dispatch, getState) => {
  const tokenAtRequest = getState?.().data?.token?.access_token;
  const headers = anonymous ? { Authorization: false } : undefined;

  let response;
  try {
    response = await axios.get(STATUS_API_URL, { headers, params: { service_status: true } });
  } catch (error) {
    console.warn('Failed to fetch the system status', error?.response?.status, error?.message);
    dispatch(fetchSystemStatusError(error));
    if (!anonymous) {
      // Stop waiting for Tableau and Otus, so a hidden tab's URL redirects.
      dispatch({ type: SET_SYSTEM_CONFIG, payload: { userConfigLoaded: true } });
    }
    throw error;
  }

  // A response that arrives after sign-out must not restore the last user's
  // settings.
  const sameUser = getState?.().data?.token?.access_token === tokenAtRequest;
  dispatch(setSystemConfigFromSystemStatus(response.data.data, { includeUserConfig: !anonymous && sameUser }));
  dispatch(fetchSystemStatusSuccess(response));
  return response.data.data;
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
    title: service.heartbeat.title,
    keyDefaultTitle: 'heartBeatDefTitle',
    timestamp: service.heartbeat.latest_at ? new Date(service.heartbeat.latest_at) : null,
  },
  datasource: {
    title: service.datasource.title,
    keyDefaultTitle: 'datasourceDefTitle',
    timestamp: service.datasource.latest_at ? new Date(service.datasource.latest_at) : null,
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
  titleKey: 'initialNetworkStatusTitle',
  detailsKey: window.navigator.onLine ? 'networkOnlineLabel' : 'networkOfflineLabel',
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
      titleKey: 'serverVersionLabel',
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
    titleKey: 'serverVersionLabel'
  };
});

const INITIAL_REALTIME_STATUS_STATE = genericStatusModel({
  titleKey: 'initialRealTimeStatusTitle',
  detailsKey: 'initialRealTimeStatusDetails',
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
