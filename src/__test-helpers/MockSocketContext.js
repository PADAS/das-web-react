import React, { createContext, useState } from 'react';
import SocketMock from 'socket.io-mock';

export const SocketContext = createContext(null);
export const mockedSocket = new SocketMock();

const MockSocketContext = (props) => { // eslint-disable-line react/display-name
  const { children } = props;

  const [websocket] = useState(mockedSocket);

  return <SocketContext.Provider value={websocket}>
    {children}
  </SocketContext.Provider>;
};

export default MockSocketContext;