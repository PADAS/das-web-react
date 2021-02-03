import React, { createContext, useEffect, useRef } from 'react';
import createSocket, { unbindSocketEvents } from '../socket';

const SocketContext = createContext(null);

const WithSocketContext = (props) => { // eslint-disable-line react/display-name
  const { children } = props;
  const socket = useRef(null);
  useEffect(() => {
    socket.current = createSocket();
    return () => {
      unbindSocketEvents(socket.current);
      socket.current.disconnect();
    };
  }, []);

  return <SocketContext.Provider value={socket.current}>
    {children}
  </SocketContext.Provider>;
};

export default WithSocketContext;
export { SocketContext };