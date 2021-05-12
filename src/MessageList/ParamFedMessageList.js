import React, { memo, useMemo, useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react';


import { extractSubjectFromMessage } from '../utils/messaging';
import { bulkReadMessages, messageListReducer, fetchMessages, fetchMessagesSuccess, updateMessageFromRealtime, fetchMessagesNextPage, INITIAL_MESSAGE_LIST_STATE } from '../ducks/messaging';
import { SocketContext } from '../withSocketConnection';

import LoadingOverlay from '../LoadingOverlay';

import styles from './styles.module.scss';

import MessageList from './';

const ParamFedMessageList = (props) => { /* eslint-disable-line react/display-name */
  const { params, isReverse = false, ...rest } = props;

  const [state, dispatch] = useReducer(messageListReducer, INITIAL_MESSAGE_LIST_STATE);
  const isInit = useRef(false);
  const scrollPositionTimeout = useRef(null);
  const [loading, setLoadState] = useState(false);
  const containerRef = useRef(null);
  const socket = useContext(SocketContext);

  const messages = useMemo(() => {
    if (isReverse) {
      return [...state.results].sort((a, b) => new Date(a.message_time) - new Date(b.message_time));
    }
    return state.results;
  }, [isReverse, state.results]);

  const unreads = useMemo(() => state.results.filter(msg => !msg.read), [state.results]);

  const setListScrollPosition = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = isReverse ? containerRef.current.querySelector('ul').scrollHeight : 0;
    }
    isInit.current = true;
  }, [isReverse]);

  const onScroll = useCallback(() => {
    window.clearTimeout(scrollPositionTimeout.current);
    fetchMessagesNextPage(state.next)
      .then((response) => {
        dispatch(fetchMessagesSuccess(response.data.data));
      })
      .finally(() => {
        if (!isInit.current) {
          scrollPositionTimeout.current = window.setTimeout(() => {
            setListScrollPosition();
          }, 200);
        }
      });
  }, [setListScrollPosition, state.next]);

  useEffect(() => {
    if (params) {
      window.clearTimeout(scrollPositionTimeout.current);
      setLoadState(true);
      isInit.current = false;
      fetchMessages(params, true)
        .then((response) => {
          dispatch(fetchMessagesSuccess(response.data.data, true));
        })
        .finally(() => {
          scrollPositionTimeout.current = window.setTimeout(() => {
            setListScrollPosition();
          }, 200);
          setLoadState(false);
        });
    }
  }, [params, dispatch, setListScrollPosition]);

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

  useEffect(() => {
    if (!!unreads.length) {
      const ids = unreads.map(({ id }) => id);
      bulkReadMessages(ids);
    }
  }, [unreads]);

  return <div ref={containerRef} className={styles.scrollContainer}>
    <MessageList emptyMessage={loading ? <LoadingOverlay message='Loading messages...' /> : undefined} containerRef={containerRef} hasMore={!!state.next} onScroll={onScroll} isReverse={isReverse} messages={messages} {...rest} />
  </div>;
};


export default memo(ParamFedMessageList);
