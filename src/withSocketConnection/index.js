import React, { createContext, useEffect, useState } from 'react';
import createSocket, { unbindSocketEvents } from '../socket';

const SocketContext = createContext(null);

const WithSocketContext = (props) => { // eslint-disable-line react/display-name
  const { children } = props;

  const [websocket, setWebsocket] = useState(null);

  useEffect(() => {
    const socket = createSocket();
    setWebsocket(socket);
    return () => {
      unbindSocketEvents(socket);
    };
  }, []);

  return !!websocket && <SocketContext.Provider value={websocket}>
    {children}
  </SocketContext.Provider>;
};

export default WithSocketContext;
export { SocketContext };