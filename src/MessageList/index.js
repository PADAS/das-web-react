import React, { memo, useMemo, useState } from 'react';
import { findDOMNode } from 'react-dom';
import format from 'date-fns/format';
import InfiniteScroll from 'react-infinite-scroller';
import isSameDay from 'date-fns/is_same_day';
import isToday from 'date-fns/is_today';
import isYesterday from 'date-fns/is_yesterday';
import noop from 'lodash/noop';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { DATE_LOCALES } from '../constants';
import { SENDER_DETAIL_STYLES } from './SenderDetails';
import { SHORTENED_DATE_FORMAT } from '../utils/datetime';
import { uuid } from '../utils/string';

import MessageListItem from './MessageListItem';
import MessageSummaryListItem from './MessageSummaryListItem';

import styles from './styles.module.scss';

const calcMessageGroupTitle = (date, i18n, t) => {
  if (isToday(date)) {
    return t('groupTitle.today');
  }
  if (isYesterday(date)) {
    return t('groupTitle.yesterday');
  }
  return format(date, SHORTENED_DATE_FORMAT, { locale: DATE_LOCALES[i18n.language] });
};

export const MESSAGE_LIST_TYPES = {
  GENERAL: 'general',
  SUMMARY: 'summary',
};

const MessageList = ({
  className,
  containerRef,
  emptyMessage,
  hasMore,
  isReverse,
  messages,
  onMessageClick,
  onMessageSubjectClick,
  onScroll,
  readMessageClassName,
  senderDetailStyle,
  type,
  unreadMessageClassName,
}) => {
  const { i18n, t } = useTranslation('components', { keyPrefix: 'messageList' });

  const [instanceId] = useState(uuid());

  const groupedByDate = useMemo(() => messages.reduce((accumulator, message) => {
    if (!accumulator.length
      || !isSameDay(new Date(message.message_time), new Date(accumulator[accumulator.length - 1].date))) {
      return [
        ...accumulator,
        {
          date: message.message_time,
          messages: [[message]],
          title: calcMessageGroupTitle(new Date(message.message_time), i18n, t),
        },
      ];
    }

    const returnVal = [...accumulator];
    const isSameSenderAsPriorMessage = message?.sender?.id
      && returnVal[returnVal.length - 1].messages[returnVal[returnVal.length - 1].messages.length - 1]?.[0]?.sender?.id === message.sender.id;
    if (isSameSenderAsPriorMessage) {
      returnVal[returnVal.length - 1].messages[returnVal[returnVal.length - 1].messages.length - 1] = [
        ...returnVal[returnVal.length - 1].messages[returnVal[returnVal.length - 1].messages.length - 1],
        message,
      ];
    } else {
      returnVal[returnVal.length - 1].messages = [...returnVal[returnVal.length - 1].messages, [message]];
    }
    return returnVal;
  }, []), [i18n, messages, t]);

  const ListItemComponent = type === MESSAGE_LIST_TYPES.SUMMARY ? MessageSummaryListItem : MessageListItem;
  return <InfiniteScroll
      className={`${styles.messageHistory} ${className}`}
      element="ul"
      getScrollParent={() => containerRef ? findDOMNode(containerRef.current) : null} // eslint-disable-line react/no-find-dom-node 
      hasMore={hasMore}
      isReverse={isReverse}
      loadMore={onScroll}
      useWindow={false}
    >
    {!!groupedByDate.length && groupedByDate.map((group, index) => <li key={`${instanceId}-message-group-${index}`}>
      {!isReverse && <h6 className={styles.dividerTitle}>
        <span>{group.title}</span>
      </h6>}

      <ul>
        {group.messages.map((message) => <ListItemComponent
          key={`${instanceId}-message-${Array.isArray(message) ? message?.[0]?.id : message.id}`}
          messageGroup={message}
          onClick={onMessageClick}
          onMessageSubjectClick={onMessageSubjectClick}
          readMessageClassName={readMessageClassName}
          senderDetailStyle={senderDetailStyle}
          unreadMessageClassName={unreadMessageClassName}
        />)}
      </ul>

      {isReverse && <h6 className={`${styles.dividerTitle} ${styles.reverse}`}>
        <span>{group.title}</span>
      </h6>}
    </li>)}

    {!groupedByDate.length && <li className={styles.emptyMessage}>{emptyMessage || t('defaultEmptyMessage')}</li>}
  </InfiniteScroll>;
};

MessageList.defaultProps = {
  className: '',
  containerRef: null,
  emptyMessage: null,
  hasMore: false,
  isReverse: false,
  onMessageClick: noop,
  onMessageSubjectClick: noop,
  onScroll: noop,
  readMessageClassName: '',
  senderDetailStyle: SENDER_DETAIL_STYLES.FULL,
  type: MESSAGE_LIST_TYPES.GENERAL,
  unreadMessageClassName: '',
};

MessageList.propTypes = {
  className: PropTypes.string,
  containerRef: PropTypes.shape({
    current: PropTypes.any,
  }),
  emptyMessage: PropTypes.string,
  hasMore: PropTypes.bool,
  isReverse: PropTypes.bool,
  messages: PropTypes.arrayOf(PropTypes.shape({
    message_time: PropTypes.string,
    sender: PropTypes.object,
  })).isRequired,
  onMessageClick: PropTypes.func,
  onMessageSubjectClick: PropTypes.func,
  onScroll: PropTypes.func,
  readMessageClassName: PropTypes.string,
  senderDetailStyle: PropTypes.oneOf(Object.values(SENDER_DETAIL_STYLES)),
  type: PropTypes.oneOf(Object.values(MESSAGE_LIST_TYPES)),
  unreadMessageClassName: PropTypes.string,
};

export default memo(MessageList);
