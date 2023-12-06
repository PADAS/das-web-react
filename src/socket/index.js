import { DAS_HOST, LEGACY_RT_ENABLED } from '../constants';
import { SOCKET_HEALTHY_STATUS } from '../ducks/system-status';
import { clearAuth } from '../ducks/auth';
import { calcEventFilterForRequest } from '../utils/event-filter';
import { calcPatrolFilterForRequest } from '../utils/patrol-filter';

import { resetSocketStateTracking } from './helpers';
import { eventsBounding as latestEventBounding, createSocketInstance as  createLatestSocketInstance } from './implementations/latest';
import { eventsBounding as legacyEventBounding, createSocketInstance as  createLegacySocketInstance } from './implementations/legacy';
import { events } from './config';

//const io = await import(LEGACY_RT_ENABLED ? 'legacy-socket.io-client' : 'socket.io-client');

const SOCKET_URL = `${DAS_HOST}/das`;

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
      LEGACY_RT_ENABLED ? legacyEventBounding(socket, events) : latestEventBounding(socket);
    }
    eventsBound = true;

    socket.emit('event_filter', calcEventFilterForRequest({ format: 'object' }));
    socket.emit('patrol_filter', calcPatrolFilterForRequest({ format: 'object' }));
  });

  return socket;
};

export const unbindSocketEvents = (socket) => {
  socket.removeAllListeners();
};

export const createSocket = (url = SOCKET_URL) => {
  const socket = LEGACY_RT_ENABLED ? createLegacySocketInstance(url) : createLatestSocketInstance(url);

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
