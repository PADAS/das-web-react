import axios from 'axios';
import { combineReducers } from 'redux';

import { API_URL, REACT_APP_DAS_HOST, STATUSES } from '../constants';

const STATUS_API_URL = `${API_URL}status`;

// actions
const FETCH_SYSTEM_STATUS_SUCCESS = 'FETCH_SYSTEM_STATUS_SUCCESS';
const FETCH_SYSTEM_STATUS_ERROR = 'FETCH_SYSTEM_STATUS_ERROR';

export const NETWORK_STATUS_CHANGE = 'NETWORK_STATUS_CHANGE';
const SERVER_VERSION_CHANGE = 'SERVER_VERSION_CHANGE';
const SERVER_STATUS_CHANGE = 'SERVER_STATUS_CHANGE';

export const SOCKET_HEALTHY_STATUS = 'SOCKET_HEALTHY_STATUS';
export const SOCKET_UNHEALTHY_STATUS = 'SOCKET_UNHEALTHY_STATUS';
export const SOCKET_WARNING_STATUS = 'SOCKET_WARNING_STATUS';
export const SOCKET_SERVICE_STATUS = 'SOCKET_SERVICE_STATUS';

const { HEALTHY_STATUS, WARNING_STATUS, UNHEALTHY_STATUS, UNKNOWN_STATUS } = STATUSES;

// action creators
export const fetchSystemStatus = () => {
  return async function (dispatch) {
    const response = await axios.get(STATUS_API_URL, {
      params: {
        service_status: true,
      },
    }).catch(error => dispatch(fetchSystemStatusError(error)));

    return dispatch(fetchSystemStatusSuccess(response));
  };
};

const fetchSystemStatusSuccess = ({ data: { data } }) => ({
  type: FETCH_SYSTEM_STATUS_SUCCESS,
  payload: data,
});

const fetchSystemStatusError = error => ({
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
          return state.map(item => ({ ...item, status: UNKNOWN_STATUS }))
        }
        return {
          ...state,
          status: UNKNOWN_STATUS,
        }
      } else {
        return reducer(state, action);
      }
    }
    default: {
      return reducer(state, action);
    }
  }
}

const INITIAL_NETWORK_STATUS_STATE = genericStatusModel({
  title: 'Network',
  details: window.navigator.onLine ? 'online' : 'offline',
  status: window.navigator.onLine ? HEALTHY_STATUS: UNHEALTHY_STATUS,
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
      return {
        ...state,
        version,
        title: `EarthRanger Server ${version}`,
      }
    }
    case (NETWORK_STATUS_CHANGE): {
      if (payload === HEALTHY_STATUS) {
        return {
          ...state,
          status: HEALTHY_STATUS,
        };
      }
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
  return {
    version: version,
    details: REACT_APP_DAS_HOST,
    status: HEALTHY_STATUS,
    title: `EarthRanger Server ${version}`,
  };
});

const INITIAL_REALTIME_STATUS_STATE = genericStatusModel({
  title: 'EarthRanger Realtime',
  details: 'Activity:',
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
    case(SERVER_STATUS_CHANGE): {
      if (payload === UNKNOWN_STATUS) {
        return {
          ...state,
          status: UNKNOWN_STATUS,
        }
      }
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
    case(SERVER_STATUS_CHANGE): {
      if (payload === UNKNOWN_STATUS) {
        return state.map(service => ({ ...service, status: UNKNOWN_STATUS }));
      }
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
