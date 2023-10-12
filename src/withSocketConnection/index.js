import React, { createContext, useEffect, useState } from 'react';
import { bindSocketEvents, createSocket, unbindSocketEvents } from '../socket';
import store from '../store';

const SocketContext = createContext(null);

const WithSocketContext = (props) => {
  const { children } = props;

  const [websocket, setWebsocket] = useState(null);

  useEffect(() => {
    let socketReconnectTimeout;

    const instantiate = () => {
      const socket = createSocket();
      const socketWithEvents = bindSocketEvents(socket, store);
      const instanceFailureMessages = ['error', 'disconnect', 'connect_error'];
      const managerFailureMessages = ['error', 'reconnect_error', 'reconnect_failed'];

      const teardown = () => {
        socketWithEvents.close();
        unbindSocketEvents(socketWithEvents);
        window.clearTimeout(socketReconnectTimeout);
      };

      const restart = () => {
        teardown();
        socketReconnectTimeout = setTimeout(instantiate, 5000);
      };

      instanceFailureMessages.forEach((msg) => socketWithEvents.on(msg, restart));
      managerFailureMessages.forEach((msg) => socketWithEvents.io.on(msg, restart));

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