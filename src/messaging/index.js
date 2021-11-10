import React, { useReducer } from 'react';
import MessageContext from './context';

import { messageListReducer, INITIAL_MESSAGE_LIST_STATE } from '../ducks/messaging';

const WithMessageContext = ({ children }) => {
  const [state, dispatch] = useReducer(messageListReducer, INITIAL_MESSAGE_LIST_STATE);

  return <MessageContext.Provider value={{ state, dispatch }}>
    {children}
  </MessageContext.Provider>;
};

export default WithMessageContext;