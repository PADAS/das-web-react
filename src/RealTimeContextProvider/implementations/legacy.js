import isFunction from 'lodash-es/isFunction';

import {
  resetSocketStateTracking,
  updateSocketStateTrackerForEventType,
  validateSocketIncrement
} from '../helpers';
import { showFilterMismatchToastForHiddenReports } from '../handlers';
import store from '../../store';
import { socketEventData } from '../../ducks/events';
import { SOCKET_HEALTHY_STATUS } from '../../ducks/system-status';


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

export const errorHandlersBounding = (socketWithEvents, restartConnFn) => {
  const failureMessages = ['error', 'disconnect', 'connect_error', 'reconnect_error', 'reconnect_failed'];
  failureMessages.forEach((msg) => socketWithEvents.on(msg, restartConnFn));
};

export const eventsBounding = (socket, events) => {
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
};