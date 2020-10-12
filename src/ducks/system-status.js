import axios from 'axios';
import { combineReducers } from 'redux';

import { API_URL, FEATURE_FLAGS, REACT_APP_DAS_HOST, STATUSES, DEFAULT_SHOW_TRACK_DAYS } from '../constants';
import { setServerVersionAnalyticsDimension, setSitenameDimension } from '../utils/analytics';

const STATUS_API_URL = `${API_URL}status`;

// actions
const FETCH_SYSTEM_STATUS_SUCCESS = 'FETCH_SYSTEM_STATUS_SUCCESS';
const FETCH_SYSTEM_STATUS_ERROR = 'FETCH_SYSTEM_STATUS_ERROR';

const NETWORK_STATUS_CHANGE = 'NETWORK_STATUS_CHANGE';
const SERVER_VERSION_CHANGE = 'SERVER_VERSION_CHANGE';
const SERVER_STATUS_CHANGE = 'SERVER_STATUS_CHANGE';

export const SOCKET_HEALTHY_STATUS = 'SOCKET_HEALTHY_STATUS';
export const SOCKET_UNHEALTHY_STATUS = 'SOCKET_UNHEALTHY_STATUS';
export const SOCKET_WARNING_STATUS = 'SOCKET_WARNING_STATUS';
export const SOCKET_SERVICE_STATUS = 'SOCKET_SERVICE_STATUS';

export const SET_ZENDESK_ENABLED = 'SET_ZENDESK_ENABLED';
export const SET_DAILY_REPORT_ENABLED = 'SET_DAILY_REPORT_ENABLED';
export const SET_EXPORT_KML_ENABLED = 'SET_EXPORT_KML_ENABLED';
export const SET_PATROL_MANAGEMENT_ENABLED = 'SET_PATROL_MANAGEMENT_ENABLED';
export const SET_ALERTS_ENABLED = 'SET_ALERTS_ENABLED';
export const SET_EULA_ENABLED = 'SET_EULA_ENABLED';
export const SET_SHOW_TRACK_DAYS = 'SET_SHOW_TRACK_DAYS';
export const SET_SITENAME = 'SET_SITENAME';

const { HEALTHY_STATUS, WARNING_STATUS, UNHEALTHY_STATUS, UNKNOWN_STATUS } = STATUSES;

// action creators
export const updateNetworkStatus = (status) => ({
  type: NETWORK_STATUS_CHANGE,
  payload: status,
});

export const fetchSystemStatus = () => (dispatch) => axios.get(STATUS_API_URL, {
  params: {
    service_status: true,
  },
})
  .then((response) => {
    dispatch(setZendeskConfigStatus(response));
    dispatch(setSystemConfig(response));
    dispatch(fetchSystemStatusSuccess(response));
  })
  .catch(error => {
    dispatch(fetchSystemStatusError(error));
    // throw error;
  });

const setZendeskConfigStatus = (response) => (dispatch) => {
  let enabled;
  try {
    window.zE(() => {
      window.zE.identify({
        name: response.data.data.eus_settings.name,
        email: response.data.data.eus_settings.email,
        organization: response.data.data.eus_settings.organization,
      });
    });
    enabled = true;
  } catch (e) {
    enabled = false;
  }
  dispatch({
    type: SET_ZENDESK_ENABLED,
    payload: enabled,
  });
};

const setSystemConfig = ({ data: { data } }) => (dispatch) => {
  dispatch({
    type: SET_DAILY_REPORT_ENABLED,
    payload: data[FEATURE_FLAGS.DAILY_REPORT],
  });
  dispatch({
    type: SET_EXPORT_KML_ENABLED,
    payload: data[FEATURE_FLAGS.KML_EXPORT],
  });
  dispatch({
    type: SET_PATROL_MANAGEMENT_ENABLED,
    payload: data[FEATURE_FLAGS.PATROL_MANAGEMENT],
  });
  dispatch({
    type: SET_ALERTS_ENABLED,
    payload: data[FEATURE_FLAGS.ALERTS],
  });
  dispatch({
    type: SET_EULA_ENABLED,
    payload: data[FEATURE_FLAGS.EULA],
  });
  dispatch({
    type: SET_SHOW_TRACK_DAYS,
    payload: data.show_track_days,
  });
  dispatch({
    type: SET_SITENAME,
    payload: data.site_name || window.location.hostname,
  });
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
      ...state,
      ...genericStatusModel({
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
    details: REACT_APP_DAS_HOST || window.location.origin,
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
  [FEATURE_FLAGS.DAILY_REPORT]: false,
  [FEATURE_FLAGS.DAILY_REPORT]: false,
  [FEATURE_FLAGS.KML_EXPORT]: false,
  [FEATURE_FLAGS.ALERTS]: false,
  [FEATURE_FLAGS.EULA]: false,
  showTrackDays: DEFAULT_SHOW_TRACK_DAYS,
  sitename: '',
};
export const systemConfigReducer = (state = INITIAL_SYSTEM_CONFIG_STATE, { type, payload }) => {
  switch (type) {
  case (SET_ZENDESK_ENABLED): {
    return { ...state, zendeskEnabled: payload, };
  }
  case (SET_DAILY_REPORT_ENABLED): {
    return { ...state, [FEATURE_FLAGS.DAILY_REPORT]: payload, };
  }
  case (SET_EXPORT_KML_ENABLED): {
    return { ...state, [FEATURE_FLAGS.KML_EXPORT]: payload, };
  }

  case (SET_PATROL_MANAGEMENT_ENABLED): {
    return { ...state, [FEATURE_FLAGS.PATROL_MANAGEMENT]: payload, };
  }

  case (SET_ALERTS_ENABLED): {
    return { ...state, [FEATURE_FLAGS.ALERTS]: payload, };
  }
  case (SET_SHOW_TRACK_DAYS): {
    return { ...state, showTrackDays: payload, };
  }
  case (SET_EULA_ENABLED): {
    return { ...state, [FEATURE_FLAGS.EULA]: payload, };
  }
  case (SET_SITENAME): {
    setSitenameDimension(payload);
    return { ...state, sitename: payload };
  }
  default: {
    return state;
  }
  }
};
