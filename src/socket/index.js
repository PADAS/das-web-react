import io from 'socket.io-client';
import isFunction from 'lodash/isFunction';

import { store } from '../index';
import { REACT_APP_DAS_HOST } from '../constants';
import { events, SOCKET_RECOVERY_DISPATCHES } from './config';
import { SOCKET_HEALTHY_STATUS } from '../ducks/system-status';
import { newSocketActivity, resetSocketActivityState } from '../ducks/realtime';
import { clearAuth } from '../ducks/auth';

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
      resetSocketStateTracking(socket);
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
      resetSocketStateTracking(socket);
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
    resetSocketStateTracking(socket);
  });
  socket.on('connect_error', () => {
    console.log('realtime: connection error');
    resetSocketStateTracking(socket);
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
    }

    eventsBound = true;
  });
};

const resetSocketStateTracking = (socket) => {
  store.dispatch(resetSocketActivityState());
  SOCKET_RECOVERY_DISPATCHES.forEach(actionCreator => store.dispatch(actionCreator()));
  return socket;
};

export const unbindSocketEvents = (socket) => {
  socket.removeAllListeners();
};

export default (url = SOCKET_URL) => {
  const socket = io(url);
  bindSocketEvents(socket, store);
  return socket;
};
