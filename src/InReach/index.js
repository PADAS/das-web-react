import React, { useContext, useEffect, useReducer } from 'react';
import MessageContext from './context';
import { SocketContext } from '../withSocketConnection';

import { messageStoreReducer, fetchMessages, fetchMessagesSuccess, updateMessageFromRealtime } from '../ducks/messaging';

const withMessageContext = (Component) => (props) => { /* eslint-disable-line react/display-name, */
  const messageContext = useContext(MessageContext);

  return <Component {...props} messageContext={messageContext} />;
};

const MessageProvider = ({ children }) => {
  const [state, dispatch] = useReducer(messageStoreReducer, {});
  const socket = useContext(SocketContext);

  useEffect(() => {
    const handleRealtimeMessage = (msg) => {
      dispatch(updateMessageFromRealtime(msg));
    };
    
    socket.on('radio_message', handleRealtimeMessage);

    return () => {
      socket.off('radio_message', handleRealtimeMessage);
    };
  }, [socket]);

  useEffect(() => {
    fetchMessages()
      .then((response) => {
        dispatch(fetchMessagesSuccess(response?.data?.data?.results ?? []));
      })
      .catch((error) => {
        console.warn('error fetching messages', { error });
      });
  }, []);

  return <MessageContext.Provider value={{ state, dispatch }}>
    {children}
  </MessageContext.Provider>;
};

export { withMessageContext };

export default MessageProvider;