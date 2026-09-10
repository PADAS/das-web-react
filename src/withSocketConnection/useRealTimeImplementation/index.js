import React, { useCallback, useEffect, useState } from 'react';

import { DAS_HOST } from '../../constants';
import { resetSocketStateTracking } from './helpers';
import { SOCKET_HEALTHY_STATUS } from '../../ducks/system-status';
import { clearAuth } from '../../ducks/auth';
import { isStepUpChallenge, parseAuthChallenge, recoverAuth } from '../../utils/auth-recovery';
import { events } from './config';
import { calcEventFilterForRequest } from '../../utils/event-filter';
import { calcPatrolFilterForRequest } from '../../utils/patrol-filter';
import {
  errorHandlersBounding as errorHandlersBoundingLatest,
  eventsBounding as latestEventBounding
} from './implementations/latest';

const SOCKET_URL = `${DAS_HOST}/das`;

// This object should be removed/updated when single-tenant are no longer supported
const RTImplementation = {
  eventsBounding: latestEventBounding,
  errorHandlersBounding: errorHandlersBoundingLatest,
};

const useRealTimeImplementation = () => {
  const [socketIOPackage, setSocketIOPackage] = useState(null);
  const { eventsBounding, errorHandlersBounding } = RTImplementation;

  const pingSocket = useCallback((socket) => {
    let pinged = false, interval, timeout;
    socket.on('echo_resp', () => {
      pinged = true;
    });

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
  }, []);

  const bindSocketEvents = useCallback((socket, store) => {
    let eventsBound = false;
    let pingInterval, pingTimeout;
    let authRetried = false;

    const authorize = () => {
      socket.emit('authorization', { type: 'authorization', id: 1, authorization: `Bearer ${store.getState().data.token.access_token}` });

      const profileId = store.getState().data.selectedUserProfile?.id;
      if (profileId) {
        socket.emit('profile', { profile_id: profileId });
      }
    };

    socket.on('connect', () => {
      store.dispatch({ type: SOCKET_HEALTHY_STATUS });
      authorize();
      console.log('realtime: connected');
    });
    socket.on('disconnect', (msg) => {
      console.log('realtime: disconnected', msg);
    });
    socket.on('connect_error', (msg) => {
      console.log('realtime: connection error', msg);
    });
    socket.on('resp_authorization', async (msg) => {
      const { status } = msg;
      if (status.code === 401) {
        // Step-up bypasses the once-per-cycle guard: it redirects rather than looping.
        const challenge = status.www_authenticate;
        const stepUp = isStepUpChallenge(challenge);
        if (stepUp || !authRetried) {
          authRetried = true;
          try {
            await recoverAuth(stepUp ? { stepUp: true, challenge: parseAuthChallenge(challenge) } : undefined);
            console.log('realtime: token renewed; re-authorizing');
            return authorize();
          } catch (renewalError) {
            console.warn('realtime token renewal failed; signing out', renewalError);
          }
        }
        console.warn('realtime auth rejected', msg);
        return store.dispatch(clearAuth());
      }

      console.log('realtime: authorized', msg);
      authRetried = false;

      window.clearInterval(pingInterval);
      window.clearTimeout(pingTimeout);

      [pingInterval, pingTimeout] = pingSocket(socket);

      if (!eventsBound) {
        eventsBounding(socket, events);
      }
      eventsBound = true;

      socket.emit('event_filter', calcEventFilterForRequest({ format: 'object' }));
      socket.emit('patrol_filter', calcPatrolFilterForRequest({ format: 'object' }));
    });

    return socket;
  }, [pingSocket, eventsBounding]);

  const unbindSocketEvents = useCallback((socket) => socket.removeAllListeners(), []);

  const createSocket = useCallback((url = SOCKET_URL) => {
    if (!socketIOPackage) {
      return;
    }

    const socket = socketIOPackage.io(url, {
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
  }, [socketIOPackage]);

  useEffect(() => {
    const importSocketIOPackage = async () => {
      let socketIO = null;
      socketIO = await import('socket.io-client');
      setSocketIOPackage({
        io: (...args) => socketIO.default(...args)
      });
    };
    importSocketIOPackage();
  }, []);

  return {
    socketIO: socketIOPackage,
    bindSocketEvents,
    createSocket,
    unbindSocketEvents,
    errorHandlersBounding
  };
};

export default useRealTimeImplementation;
