import React, { createContext, useEffect, useState } from 'react';
import SocketMock from 'socket.io-mock';

const SocketContext = createContext(null);
const mockedSocket = new SocketMock();

const MockSocketContext = (props) => { // eslint-disable-line react/display-name
  const { children } = props;

  const [websocket, setWebsocket] = useState(null);

  useEffect(() => {
    setWebsocket(mockedSocket.socketClient);
  }, []);

  useEffect(() => {
    console.log({ websocket });
  }, [websocket]);

  return !!websocket && <SocketContext.Provider value={websocket}>
    {children}
  </SocketContext.Provider>;
};

export default MockSocketContext;
export { SocketContext, mockedSocket };

jest.doMock('../withSocketConnection', () => ({
  SocketContext,
  default: MockSocketContext,
})); 