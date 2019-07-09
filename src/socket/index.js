import io from 'socket.io-client';
import { store } from '../index';
import { REACT_APP_DAS_HOST } from '../constants';
import { events } from './config';
import { newSocketActivity, socketPingTimeout } from '../ducks/realtime';
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
      console.log('socket invalid', type);
    } else {
      console.log('message valid', type, mid);
      updateSocketStateTrackerForEventType({ type, mid });
      return callback(payload);
    }
  });
};

const validateSocketIncrement = (type, mid) => (store.getState().data.socketUpdates[type].mid + 1) === mid;


const bindSocketEvents = (socket, store) => {
  console.log('binding socket');
  socket.on('connect', () => {
    socket.emit('authorization', { type: 'authorization', id: 1, authorization: `Bearer ${store.getState().data.token.access_token}` });
  });
  socket.on('disconnect', (msg) => {
    console.log('realtime: disconnected', msg);
    resetSocketBindings(socket);
  });
  socket.on('connect_error', () => {
    console.log('realtime: connection error');
    resetSocketBindings(socket);
  });
  socket.on('resp_authorization', ({ status }) => {
    if (status.code === 401) {
      return store.dispatch(clearAuth());
    }
    Object.entries(events).forEach(([event_name, actionTypes]) => {
      return stateManagedSocketEventHandler(socket, event_name, (payload) => {
        actionTypes.forEach(type => store.dispatch({ type, payload }));
      });

    });
  });
};

export const resetSocketBindings = (socket) => {
  unbindSocketEvents(socket);
  setTimeout(() => bindSocketEvents(socket, store), 3000);
  return socket;
};

export const unbindSocketEvents = (socket) => {
  console.log('unbinding socket');
  socket.removeAllListeners();
};

export default (url = SOCKET_URL) => {
  const socket = io(url);
  bindSocketEvents(socket, store);
  return socket;
};


