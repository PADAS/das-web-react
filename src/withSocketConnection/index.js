import React, { createContext, useEffect, useState } from 'react';

import store from '../store';
import useRealTimeImplementation from './useRealTimeImplementation';

const SocketContext = createContext(null);

const WithSocketContext = (props) => {
  const { children } = props;
  const [websocket, setWebsocket] = useState(null);
  const {
    bindSocketEvents,
    createSocket,
    unbindSocketEvents,
    errorHandlersBounding,
    socketIO
  } = useRealTimeImplementation();

  useEffect(() => {
    if (socketIO){
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

        errorHandlersBounding(socketWithEvents, restart);
        setWebsocket(socketWithEvents);

        return [socketWithEvents, teardown];
      };

      const [, teardown] = instantiate();

      return teardown;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketIO]);

  return !!websocket && <SocketContext.Provider value={websocket}>
    {children}
  </SocketContext.Provider>;
};

export default WithSocketContext;
export { SocketContext };