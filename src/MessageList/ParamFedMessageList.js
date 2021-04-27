import React, { memo, useMemo, useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react';


import { extractSubjectFromMessage } from '../utils/messaging';
import { messageListReducer, fetchMessages, fetchMessagesSuccess, updateMessageFromRealtime, fetchMessagesNextPage, INITIAL_MESSAGE_LIST_STATE } from '../ducks/messaging';
import { SocketContext } from '../withSocketConnection';

import LoadingOverlay from '../LoadingOverlay';

import styles from './styles.module.scss';

import MessageList from './';

const ParamFedMessageList = (props) => { /* eslint-disable-line react/display-name */
  const { params = {}, isReverse = false, ...rest } = props;

  const [state, dispatch] = useReducer(messageListReducer, INITIAL_MESSAGE_LIST_STATE);
  const [loading, setLoadState] = useState(false);
  const containerRef = useRef(null);
  const socket = useContext(SocketContext);

  const messages = useMemo(() => {
    if (isReverse) {
      return [...state.results].sort((a, b) => new Date(a.message_time) - new Date(b.message_time));
    }
    return state.results;
  }, [isReverse, state.results]);

  const onScroll = useCallback(() => {
    fetchMessagesNextPage(state.next)
      .then((response) => {
        dispatch(fetchMessagesSuccess(response.data.data));
      });
  }, [state.next]); 
  
  useEffect(() => {
    setLoadState(true);
    fetchMessages(params, true)
      .then((response) => {
        dispatch(fetchMessagesSuccess(response.data.data, true));
      })
      .finally(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.querySelector('ul').scrollHeight;
        }
        setLoadState(false);
      });
  }, [params, dispatch]);

  const setListScrollPosition = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = isReverse ? containerRef.current.querySelector('ul').scrollHeight : 0;
    }
  }, [isReverse]);

  useEffect(() => {
    const consumeMessage = (msg) => {
      dispatch(updateMessageFromRealtime(msg));
      setListScrollPosition();
    };

    const handleRealtimeMessage = ({ data:msg }) => {
      if (!params?.subject_id) {
        consumeMessage(msg);
      }

      else if (params.subject_id.includes(extractSubjectFromMessage(msg)?.id)) {
        consumeMessage(msg);
      }
    };
    
    socket.on('radio_message', handleRealtimeMessage);

    return () => {
      socket.off('radio_message', handleRealtimeMessage);
    };
  }, [dispatch, isReverse, params, setListScrollPosition, socket]);

  useEffect(() => {
    setListScrollPosition();
  }, [setListScrollPosition]);

  return <div ref={containerRef} className={styles.scrollContainer}>
    {loading && <LoadingOverlay message='Loading messages...' />}
    <MessageList containerRef={containerRef} hasMore={!!state.next} onScroll={onScroll} isReverse={isReverse} messages={messages} {...rest} />
  </div>;
};


export default memo(ParamFedMessageList);


/* today */
/* yesterday */
/* datee */