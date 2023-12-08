import isFunction from 'lodash/isFunction';

import { EVENT_DISPATCHES, events } from '../config';
import store from '../../../store';
import {
  resetSocketStateTracking,
  updateSocketStateTrackerForEventType,
  validateSocketIncrement
} from '../helpers';
import { showFilterMismatchToastForHiddenReports } from '../handlers';

const executeSocketEventDispatches = (eventName, eventData) => {
  const dispatches = events[eventName] ?? EVENT_DISPATCHES[eventName];
  if (Array.isArray(dispatches)){
    dispatches.forEach(type => {
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

export const errorHandlersBounding = (socketWithEvents, restartConnFn) => {
  const instanceFailureMessages = ['error', 'disconnect', 'connect_error'];
  const managerFailureMessages = ['error', 'reconnect_error', 'reconnect_failed'];
  instanceFailureMessages.forEach((msg) => socketWithEvents.on(msg, restartConnFn));
  managerFailureMessages.forEach((msg) => socketWithEvents.io.on(msg, restartConnFn));
};

export const eventsBounding = (socket) => {
  socket.prependAny(checkSocketSanity);
  socket.onAny(executeSocketEventDispatches);
  socket.on('new_event', showFilterMismatchToastForHiddenReports);
};
