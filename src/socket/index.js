import io from 'socket.io-client';
import isFunction from 'lodash/isFunction';

import store from '../store';
import { DAS_HOST } from '../constants';
import { EVENT_DISPATCHES, events } from './config';
import { SOCKET_HEALTHY_STATUS } from '../ducks/system-status';
import { newSocketActivity, resetSocketActivityState } from '../ducks/realtime';
import { clearAuth } from '../ducks/auth';
import { calcEventFilterForRequest } from '../utils/event-filter';
import { calcPatrolFilterForRequest } from '../utils/patrol-filter';

import { showFilterMismatchToastForHiddenReports } from './handlers';

const SOCKET_URL = `${DAS_HOST}/das`;

const updateSocketStateTrackerForEventType = ({ type, mid = 0, timestamp = new Date().toISOString() }) => {
  store.dispatch(
    newSocketActivity({ type, mid, timestamp })
  );
};

const executeSocketEventActions = (eventName, eventData) => {
  const actionTypes = events[eventName] ?? EVENT_DISPATCHES[eventName];
  if (Array.isArray(actionTypes)){
    actionTypes.forEach(type => {
      if (isFunction(type)) {
        store.dispatch(type(eventData));
      } else {
        store.dispatch({ type, payload: eventData });
      }
    });
  }
};

const checkSocketSanity = (type, { mid }) => {
  if (mid){
    updateSocketStateTrackerForEventType({ type });
    if (!validateSocketIncrement(type, mid)) {
      resetSocketStateTracking();
    } else {
      updateSocketStateTrackerForEventType({ type, mid });
    }
  }
};

const validateSocketIncrement = (type, mid) => {
  if (type === 'echo_resp') return true;
  const updates = store.getState().data.socketUpdates[type];
  if (!updates) return true;
  return updates.mid + 1 === mid;
};

const pingSocket = (socket) => {
  let pinged = false;
  socket.on('echo_resp', () => {
    pinged = true;
  });

  let interval, timeout;

  interval = window.setInterval(() => {
    socket.emit('echo', { data: 'ping' });

    timeout = window.setTimeout(() => {
      if (pinged) {
        pinged = false;
      } else {
        resetSocketStateTracking();
      }
    }, [15000]);
  }, 30000);

  return [interval, timeout];
};

export const bindSocketEvents = (socket, store) => {
  let eventsBound = false;
  let pingInterval, pingTimeout;

  socket.on('connect', () => {
    store.dispatch({ type: SOCKET_HEALTHY_STATUS });
    socket.emit('authorization', { type: 'authorization', id: 1, authorization: `Bearer ${store.getState().data.token.access_token}` });
    console.log('realtime: connected');
  });
  socket.on('disconnect', (msg) => {
    console.log('realtime: disconnected', msg);
  });
  socket.on('connect_error', (msg) => {
    console.log('realtime: connection error', msg);
  });
  socket.on('resp_authorization', (msg) => {
    const { status } = msg;
    console.log('realtime: authorized', msg);
    if (status.code === 401) {
      return store.dispatch(clearAuth());
    }

    window.clearInterval(pingInterval);
    window.clearTimeout(pingTimeout);

    [pingInterval, pingTimeout] = pingSocket(socket);

    if (!eventsBound) {
      socket.prependAny(checkSocketSanity);
      socket.onAny(executeSocketEventActions);
      socket.on('new_event', showFilterMismatchToastForHiddenReports);
    }
    eventsBound = true;

    socket.emit('event_filter', calcEventFilterForRequest({ format: 'object' }));
    socket.emit('patrol_filter', calcPatrolFilterForRequest({ format: 'object' }));
  });

  return socket;
};

const resetSocketStateTracking = (socket) => {
  store.dispatch(resetSocketActivityState());
  return socket;
};

export const unbindSocketEvents = (socket) => {
  socket.removeAllListeners();
};

export const createSocket = (url = SOCKET_URL) => {
  const socket = io(url, {
    reconnection: false,
  });

  socket._on = socket.on.bind(socket);

  socket.on = (eventName, oldFn) => {
    const newFn = (msg, fn) => {
      // new behavior for all socket events. this takes a callback sent via the realtime services and sends the trace_id back to the server.
      if (fn && msg && msg.trace_id) {
        fn(msg.trace_id);
      }
      // original behavior for bound events
      return oldFn(msg, fn);
    };
    return [socket._on(eventName, newFn), newFn];
  };

  return socket;
};
