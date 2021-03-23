import React, { useContext, useReducer } from 'react';
import MessageContext from './context';

import { messageStoreReducer } from '../ducks/messaging';

const withMessageContext = (Component) => (props) => { /* eslint-disable-line react/display-name, */
  const messageContext = useContext(MessageContext);

  return <Component {...props} messageContext={messageContext} />;
};

const MessageProvider = ({ children }) => {
  const [state, dispatch] = useReducer(messageStoreReducer, {});

  return <MessageContext.Provider value={{ state, dispatch }}>
    {children}
  </MessageContext.Provider>;
};

export { withMessageContext };

export default MessageProvider;