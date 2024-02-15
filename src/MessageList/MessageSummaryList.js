import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { extractSubjectFromMessage } from '../utils/messaging';
import {
  fetchAllMessages,
  fetchMessagesNextPage,
  fetchMessagesSuccess,
  updateMessageFromRealtime,
} from '../ducks/messaging';
import MessageContext from '../InReach/context';
import { SENDER_DETAIL_STYLES } from './SenderDetails';
import { SocketContext } from '../withSocketConnection';
import WithMessageContext from '../InReach';

import LoadingOverlay from '../LoadingOverlay';
import MessageList, { MESSAGE_LIST_TYPES } from './';

import styles from './styles.module.scss';

const MessageSummaryList = (props) => {
  const { t } = useTranslation('components', { keyPrefix: 'messageList.messageSummaryList' });

  const socket = useContext(SocketContext);
  const { state, dispatch } = useContext(MessageContext);

  const containerRef = useRef(null);
  const loadStateTimeoutRef = useRef(null);

  const [loading, setLoadState] = useState(false);

  const mostRecentMessagesPerSubject = useMemo(() => state.results.reduce((accumulator, message) => {
    const subjectId = extractSubjectFromMessage(message)?.id;

    const itemIndex = accumulator.findIndex((item) => extractSubjectFromMessage(item)?.id === subjectId);
    if (!itemIndex > -1) {
      return [...accumulator, message];
    } else {
      const messageIsNewerThanExistingEntry = (new Date(message.message_time) - new Date(accumulator[itemIndex].message_time)) > 0;
      if (messageIsNewerThanExistingEntry) {
        accumulator[itemIndex] = message;
      }
      return accumulator;
    }
  }, []), [state.results]);

  const loadMoreMessages = useCallback(() => {
    setLoadState(true);
    clearTimeout(loadStateTimeoutRef.current);
    fetchMessagesNextPage(state.next)
      .then((response) => dispatch(fetchMessagesSuccess(response.data.data)))
      .finally(() => {
        loadStateTimeoutRef.current = setTimeout(() => setLoadState(false), 150);
      });
  }, [dispatch, state.next]);

  useEffect(() => {
    const handleRealtimeMessage = ({ data }) => dispatch(updateMessageFromRealtime(data));

    const [, fnRef] = socket.on('radio_message', handleRealtimeMessage);

    return () => socket.off('radio_message', fnRef);
  }, [dispatch, socket]);

  useEffect(() => {
    setLoadState(true);
    fetchAllMessages({ page_size: 100, recent_message: 1 })
      .then((results) => dispatch(fetchMessagesSuccess({ results })))
      .catch((error) => console.warn('error fetching messages', { error }))
      .finally(() => {
        loadStateTimeoutRef.current = setTimeout(() => setLoadState(false), 150);
      });
  }, [dispatch]);

  return <div ref={containerRef} className={styles.scrollContainer}>
    {loading && <LoadingOverlay className={styles.summaryLoadingOverlay} />}

    <MessageList
      className={styles.summaryList}
      containerRef={containerRef}
      emptyMessage={loading ? t('loadingEmptyMessage') : undefined}
      hasMore={!!state.next}
      messages={mostRecentMessagesPerSubject}
      onScroll={loadMoreMessages}
      senderDetailStyle={SENDER_DETAIL_STYLES.SUBJECT}
      type={MESSAGE_LIST_TYPES.SUMMARY}
      {...props}
    />
  </div>;
};

const MessageSummaryListWithMessageContext = (props) => <WithMessageContext>
  <MessageSummaryList {...props} />
</WithMessageContext>;

export default memo(MessageSummaryListWithMessageContext);
