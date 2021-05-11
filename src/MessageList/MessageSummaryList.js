import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import WithMessageContext from '../InReach';
import MessageContext from '../InReach/context';
import { SocketContext } from '../withSocketConnection';
import LoadingOverlay from '../LoadingOverlay';

import MessageList, { MESSAGE_LIST_TYPES } from './';
import { SENDER_DETAIL_STYLES } from './SenderDetails';
// import ParamFedMessageList from './ParamFedMessageList';

import { extractSubjectFromMessage } from '../utils/messaging';

import { updateMessageFromRealtime, fetchMessages, fetchMessagesNextPage, fetchMessagesSuccess } from '../ducks/messaging';

import styles from './styles.module.scss';

const MessageSummaryList = (props) => {
  const containerRef = useRef(null);
  const loadStateTimeoutRef = useRef(null);
  const [loading, setLoadState] = useState(false);

  const socket = useContext(SocketContext);
  const { state, dispatch } = useContext(MessageContext);

  const loadMoreMessages = useCallback(() => {
    setLoadState(true);
    clearTimeout(loadStateTimeoutRef.current);
    fetchMessagesNextPage(state.next)
      .then((response) => {
        dispatch(fetchMessagesSuccess(response.data.data));
      })
      .finally(() => {
        loadStateTimeoutRef.current = setTimeout(() => {
          setLoadState(false);
        }, 150);
      });
  }, [dispatch, state.next]);

  const mostRecentMessagesPerSubject = useMemo(() => {
    return state.results.reduce((accumulator, message) => {
      const subjectId = extractSubjectFromMessage(message)?.id;
      const itemIndex = accumulator.findIndex((item) => {
        const itemSubjectId = extractSubjectFromMessage(item)?.id;
        return itemSubjectId === subjectId;
      });

      const alreadyInArray = itemIndex > -1;

      if (!alreadyInArray) {
        return [
          ...accumulator,
          message,
        ];
      } else {
        const messageIsNewerThanExistingEntry = (new Date(message.message_time) - new Date(accumulator[itemIndex].message_time)) > 0;
        if (messageIsNewerThanExistingEntry) {
          accumulator[itemIndex] = message;
        }
        return accumulator;
      }

    }, []);
  }, [state.results]);

  console.log({ mostRecentMessagesPerSubject });


  useEffect(() => {
    const handleRealtimeMessage = ({ data:msg }) => {
      dispatch(updateMessageFromRealtime(msg));
    };
    
    socket.on('radio_message', handleRealtimeMessage);

    return () => {
      socket.off('radio_message', handleRealtimeMessage);
    };
  }, [dispatch, socket]);

  useEffect(() => {
    setLoadState(true);
    fetchMessages({ page_size: 500, recent_message: 1 })
      .then((response) => {
        dispatch(fetchMessagesSuccess(response.data.data));
      })
      .catch((error) => {
        console.warn('error fetching messages', { error });
      })
      .finally(() => {
        loadStateTimeoutRef.current = setTimeout(() => {
          setLoadState(false);
        }, 150);
      });
  }, [dispatch]);

  return <div ref={containerRef} className={styles.scrollContainer}>
    {loading && <LoadingOverlay className={styles.summaryLoadingOverlay} />}
    <MessageList emptyMessage={loading ? 'Loading messages...' : undefined} type={MESSAGE_LIST_TYPES.SUMMARY} senderDetailStyle={SENDER_DETAIL_STYLES.SUBJECT} className={styles.summaryList} containerRef={containerRef} hasMore={!!state.next} onScroll={loadMoreMessages} messages={mostRecentMessagesPerSubject} {...props} />
  </div>;
};  

const WithContext = (props) => <WithMessageContext>
  <MessageSummaryList {...props} />
</WithMessageContext>;

export default memo(WithContext);

