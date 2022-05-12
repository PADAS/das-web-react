import React, { createContext, useState } from 'react';
import SocketMock from 'socket.io-mock';

export const SocketContext = createContext(null);
export const mockedSocket = new SocketMock();

mockedSocket._on = mockedSocket.on.bind(mockedSocket);
mockedSocket.on = (msg, fn) => [mockedSocket._on(msg, fn), fn];

const MockSocketContext = (props) => {
  const { children } = props;

  const [websocket] = useState(mockedSocket);

  return <SocketContext.Provider value={websocket}>
    {children}
  </SocketContext.Provider>;
};

export default MockSocketContext;