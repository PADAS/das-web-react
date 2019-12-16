import io from 'socket.io-client';
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
      resetSocket(socket);
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
      window.clearInterval(interval);
      resetSocket(socket);
    }
  }, 30000);
  return interval;
};

const bindSocketEvents = (socket, store) => {
  socket.on('connect', () => {
    console.log('realtime: connected');
    store.dispatch({ type: SOCKET_HEALTHY_STATUS });
    socket.emit('authorization', { type: 'authorization', id: 1, authorization: `Bearer ${store.getState().data.token.access_token}` });
  });
  socket.on('disconnect', (msg) => {
    console.log('realtime: disconnected', msg);
    resetSocket(socket);
  });
  socket.on('connect_error', () => {
    console.log('realtime: connection error');
    resetSocket(socket);
  });
  socket.on('resp_authorization', ({ status }) => {
    if (status.code === 401) {
      return store.dispatch(clearAuth());
    }
    pingSocket(socket);

    Object.entries(events).forEach(([event_name, actionTypes]) => {
      return stateManagedSocketEventHandler(socket, event_name, (payload) => {
        actionTypes.forEach(type => store.dispatch({ type, payload }));
      });

    });
  });
};

const resetSocket = (socket) => {
  unbindSocketEvents(socket);
  store.dispatch(resetSocketActivityState());
  bindSocketEvents(socket, store);
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
