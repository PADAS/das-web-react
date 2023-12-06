import React, { createContext, useEffect, useState } from 'react';
import { bindSocketEvents, createSocket, unbindSocketEvents } from '../socket';
import store from '../store';
import { LEGACY_RT_ENABLED } from '../constants';
import { errorHandlersBounding as errorHandlersLatest } from '../socket/implementations/latest';
import { errorHandlersBounding as errorHandlersLegacy } from '../socket/implementations/legacy';

const SocketContext = createContext(null);

const WithSocketContext = (props) => {
  const { children } = props;

  const [websocket, setWebsocket] = useState(null);

  useEffect(() => {
    let socketReconnectTimeout;

    const instantiate = () => {
      const socket = createSocket();
      const socketWithEvents = bindSocketEvents(socket, store);

      const teardown = () => {
        socketWithEvents.close();
        unbindSocketEvents(socketWithEvents);
        window.clearTimeout(socketReconnectTimeout);
      };

      const restart = () => {
        teardown();
        socketReconnectTimeout = setTimeout(instantiate, 5000);
      };

      LEGACY_RT_ENABLED
        ? errorHandlersLegacy(socketWithEvents, restart)
        : errorHandlersLatest(socketWithEvents, restart);

      setWebsocket(socketWithEvents);

      return [socketWithEvents, teardown];
    };

    const [, teardown] = instantiate();

    return teardown;
  }, []);

  return !!websocket && <SocketContext.Provider value={websocket}>
    {children}
  </SocketContext.Provider>;
};

export default WithSocketContext;
export { SocketContext };