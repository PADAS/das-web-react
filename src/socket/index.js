import io from 'socket.io-client';
import { store } from '../index';
import { REACT_APP_DAS_HOST } from '../constants';
import { events } from './config';
import { clearAuth } from '../ducks/auth';

const SOCKET_URL = `${REACT_APP_DAS_HOST}/das`;

const bindSocketEvents = (socket, store) => {
  socket.on('connect', () => {
    socket.emit('authorization', { type: 'authorization', id: 1, authorization: `Bearer ${store.getState().data.token.access_token}` });
  });
  socket.on('disconnect', (msg) => {
    console.log('disconnected', msg);
  });
  socket.on('connect_error', () => {
    console.log('socket ain\'t workin');
  });
  socket.on('resp_authorization', ({ status }) => {
    if (status.code === 401) {
      return store.dispatch(clearAuth());
    }
    Object.entries(events).forEach(([event_name, actionTypes]) => {
      socket.on(event_name, (payload) => {
        actionTypes.forEach(type => store.dispatch({ type, payload }));
      })
    });
  });
};

export const unbindSocketEvents = (socket) => {
  socket.removeAllListeners();
};

export default (url = SOCKET_URL) => {
  const socket = io(url);
  bindSocketEvents(socket, store);
  return socket;
};


