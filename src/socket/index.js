import io from 'socket.io-client';
import isFunction from 'lodash/isFunction';

import store from '../store';
import { REACT_APP_DAS_HOST } from '../constants';
import { events } from './config';
import { SOCKET_HEALTHY_STATUS } from '../ducks/system-status';
import { newSocketActivity, resetSocketActivityState } from '../ducks/realtime';
import { clearAuth } from '../ducks/auth';
import { calcEventFilterForRequest } from '../utils/event-filter';
import { calcPatrolFilterForRequest } from '../utils/patrol-filter';
import { socketEventData } from '../ducks/events';

import { showFilterMismatchToastForHiddenReports } from './handlers';

const SOCKET_URL = `${REACT_APP_DAS_HOST}/das`;

const updateSocketStateTrackerForEventType = ({ type, mid = 0, timestamp = new Date().toISOString() }) => {
  store.dispatch(
    newSocketActivity({ type, mid, timestamp })
  );
};

const stateManagedSocketEventHandler = (socket, type, callback) => {
  updateSocketStateTrackerForEventType({ type });

  return socket.on(type, (payload) => {
    const { mid } = payload;
    if (!validateSocketIncrement(type, mid)) {
      resetSocketStateTracking();
    } else {
      updateSocketStateTrackerForEventType({ type, mid });
    }
    return callback(payload);
  });
};

const validateSocketIncrement = (type, mid) => {
  if (type === 'echo_resp') return true;
  const updates = store.getState().data.socketUpdates[type];
  if (!updates) return true;
  return updates.mid + 1 === mid;
};

export const pingSocket = (socket) => {
  let pinged = false;
  socket.on('echo_resp', () => {
    pinged = true;
  });
  const interval = window.setInterval(() => {
    if (pinged) {
      pinged = false;
      socket.emit('echo', { data: 'ping' });
    } else {
      resetSocketStateTracking();
    }
  }, 30000);
  socket.emit('echo', { data: 'ping' });
  return interval;
};

const bindSocketEvents = (socket, store) => {
  let eventsBound = false;

  socket.on('connect', () => {
    console.log('realtime: connected');
    store.dispatch({ type: SOCKET_HEALTHY_STATUS });
    socket.emit('authorization', { type: 'authorization', id: 1, authorization: `Bearer ${store.getState().data.token.access_token}` });
  });
  socket.on('disconnect', (msg) => {
    console.log('realtime: disconnected', msg);
    resetSocketStateTracking();
  });
  socket.on('connect_error', () => {
    console.log('realtime: connection error');
    resetSocketStateTracking();
  });
  socket.on('resp_authorization', ({ status }) => {
    if (status.code === 401) {
      return store.dispatch(clearAuth());
    }
    pingSocket(socket);

    if (!eventsBound) {
      Object.entries(events).forEach(([event_name, actionTypes]) => {
        return stateManagedSocketEventHandler(socket, event_name, (payload) => {
          actionTypes.forEach(type => {
            if (isFunction(type)) {
              store.dispatch(type(payload));
            } else {
              store.dispatch({ type, payload });
            }
          });
        });
      });
      ['new_event', 'update_event'].forEach((event_name) => {
        return stateManagedSocketEventHandler(socket, event_name, (payload) => {
          [socketEventData, SOCKET_HEALTHY_STATUS].forEach(type => {
            if (isFunction(type)) {
              store.dispatch(type(payload));
            } else {
              store.dispatch({ type, payload });
            }
          });
        });
      });
      socket.on('new_event', showFilterMismatchToastForHiddenReports);
    }
    eventsBound = true;

    socket.emit('event_filter', calcEventFilterForRequest({ format: 'object' }));
    socket.emit('patrol_filter', calcPatrolFilterForRequest({ format: 'object' }));
  });
};

const resetSocketStateTracking = (socket) => {
  store.dispatch(resetSocketActivityState());
  return socket;
};

export const unbindSocketEvents = (socket) => {
  socket.removeAllListeners();
};

const createSocket = (url = SOCKET_URL) => {
  const socket = io(url, {
    reconnectionDelay: 3000,        // how long to initially wait before attempting a new reconnection
    reconnectionDelayMax: 150000,     // maximum amount of time to wait between reconnection attempts. Each attempt increases the reconnection delay by 2x along with a randomization factor
    randomizationFactor: 0.25,
  });

  socket._on = socket.on.bind(socket);

  socket.on = (eventName, oldFn) => {
    const newFn = (msg, fn) => {
      // new behavior for all socket events
      if (fn && msg && msg.trace_id) {
        fn(msg.trace_id);
      }
      // original behavior for bound events
      return oldFn(msg, fn);
    };
    return socket._on(eventName, newFn);
  };

  bindSocketEvents(socket, store);

  console.log('created socket', socket);
  return socket;
};

export default createSocket;
