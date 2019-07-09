import React, { memo, useState, useEffect, useRef } from 'react';
import createSocket, { unbindSocketEvents } from '../socket';

const withSocketConnection = (Component) => (props) => { // eslint-disable-line react/display-name
  const socket = useRef(null);
  useEffect(() => {
    socket.current = createSocket();
    return () => {
      unbindSocketEvents(socket.current);
    };
  }, []);

  return socket.current && <Component socket={socket.current} {...props} />;
};

export default withSocketConnection;