import React, { memo, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import {
  bulkReadMessages,
  fetchMessages,
  fetchMessagesNextPage,
  fetchMessagesSuccess,
  INITIAL_MESSAGE_LIST_STATE,
  messageListReducer,
  updateMessageFromRealtime,
} from '../ducks/messaging';
import { extractSubjectFromMessage } from '../utils/messaging';
import { SocketContext } from '../withSocketConnection';

import LoadingOverlay from '../LoadingOverlay';
import MessageList from './';

import styles from './styles.module.scss';

const ParamFedMessageList = ({ isReverse, params, ...restProps }) => {
  const { t } = useTranslation('components', { keyPrefix: 'messageList.paramFedMessageList' });

  const socket = useContext(SocketContext);

  const containerRef = useRef(null);
  const isInit = useRef(false);
  const scrollPositionTimeout = useRef(null);

  const [loading, setLoadState] = useState(false);
  const [state, dispatch] = useReducer(messageListReducer, INITIAL_MESSAGE_LIST_STATE);

  const messages = useMemo(() => isReverse
    ? [...state.results].sort((a, b) => new Date(a.message_time) - new Date(b.message_time))
    : state.results, [isReverse, state.results]);

  const unreads = useMemo(() => state.results.filter((msg) => !msg.read), [state.results]);

  const setListScrollPosition = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = isReverse ? containerRef.current.querySelector('ul').scrollHeight : 0;
    }
    isInit.current = true;
  }, [isReverse]);

  const onScroll = useCallback(() => {
    window.clearTimeout(scrollPositionTimeout.current);
    fetchMessagesNextPage(state.next)
      .then((response) => dispatch(fetchMessagesSuccess(response.data.data)))
      .finally(() => {
        if (!isInit.current) {
          scrollPositionTimeout.current = window.setTimeout(() => setListScrollPosition(), 200);
        }
      });
  }, [setListScrollPosition, state.next]);

  useEffect(() => {
    if (params) {
      window.clearTimeout(scrollPositionTimeout.current);
      setLoadState(true);
      isInit.current = false;
      fetchMessages(params, true)
        .then((response) => dispatch(fetchMessagesSuccess(response.data.data, true)))
        .finally(() => {
          scrollPositionTimeout.current = window.setTimeout(() => setListScrollPosition(), 200);
          setLoadState(false);
        });
    }
  }, [params, dispatch, setListScrollPosition]);

  useEffect(() => {
    const handleRealtimeMessage = ({ data: msg }) => {
      if (!params?.subject_id || params.subject_id.includes(extractSubjectFromMessage(msg)?.id)) {
        dispatch(updateMessageFromRealtime(msg));
        setListScrollPosition();
      }
    };

    const [, fnRef] = socket.on('radio_message', handleRealtimeMessage);

    return () => socket.off('radio_message', fnRef);
  }, [dispatch, isReverse, params, setListScrollPosition, socket]);

  useEffect(() => {
    if (!!unreads.length) {
      bulkReadMessages(unreads.map(({ id }) => id));
    }
  }, [unreads]);

  return <div className={styles.scrollContainer} ref={containerRef}>
    <MessageList
      containerRef={containerRef}
      emptyMessage={loading ? <LoadingOverlay message={t('loadingEmptyMessage')} /> : undefined}
      hasMore={!!state.next}
      isReverse={isReverse}
      messages={messages}
      onScroll={onScroll}
      {...restProps}
    />
  </div>;
};

ParamFedMessageList.defaultProps = {
  isReverse: false,
  params: null,
};

ParamFedMessageList.propTypes = {
  isReverse: PropTypes.bool,
  params: PropTypes.shape({
    subject_id: PropTypes.string,
  }),
};

export default memo(ParamFedMessageList);
