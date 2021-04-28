import React, { memo, useMemo, useState } from 'react';
import { findDOMNode } from 'react-dom';
// import PropTypes from 'prop-types';
import isSameDay from 'date-fns/is_same_day';
import isToday from 'date-fns/is_today';
import isYesterday from 'date-fns/is_yesterday';

import InfiniteScroll from 'react-infinite-scroller';

import format from 'date-fns/format';

import { SHORTENED_DATE_FORMAT } from '../utils/datetime';
import { uuid } from '../utils/string';

import MessageListItem from './MessageListItem';
import MessageSummaryListItem from './MessageSummaryListItem';
import SenderDetails, { SENDER_DETAIL_STYLES } from './SenderDetails';

import styles from './styles.module.scss';

const calcMessageGroupTitle = (date) => {
  if (isToday(date)) return 'today';
  if (isYesterday(date)) return 'yesterday';
  return format(date, SHORTENED_DATE_FORMAT);
};

export const MESSAGE_LIST_TYPES = {
  GENERAL: 'general',
  SUMMARY: 'summary',
};

const MessageList = (props) => { /* eslint-disable-line react/display-name */
  const { className = '', senderDetailStyle = SENDER_DETAIL_STYLES.FULL, onMessageClick = () => null, type = MESSAGE_LIST_TYPES.GENERAL, emptyMessage = 'No messages to display.', unreadMessageClassName = '', readMessageClassName = '',  containerRef, hasMore = false, onScroll = () => null, isReverse = false, messages = [], } = props;

  const [instanceId] = useState(uuid());

  const groupedByDate = useMemo(() => messages.reduce((accumulator, message) => {
    if (
      !accumulator.length
      || !isSameDay(new Date(message.message_time), new Date(accumulator[accumulator.length - 1].date))
    ) {
      return [
        ...accumulator,
        {
          date: message.message_time,
          title: calcMessageGroupTitle(new Date(message.message_time)),
          messages: [message],
        },
      ];
    }
    const returnVal = [...accumulator];
    
    returnVal[returnVal.length - 1].messages = [
      ...returnVal[returnVal.length - 1].messages,
      message,
    ];
    return returnVal;

  }, []), [messages]);

  const ListItemComponent = type === MESSAGE_LIST_TYPES.SUMMARY ? MessageSummaryListItem : MessageListItem;

  return   <InfiniteScroll
    element='ul'
    hasMore={hasMore}
    loadMore={onScroll}
    isReverse={isReverse}
    className={`${styles.messageHistory} ${className}`}
    useWindow={false}
    getScrollParent={() => containerRef ? findDOMNode(containerRef.current) : null} // eslint-disable-line react/no-find-dom-node 
  >
    {!!groupedByDate.length && groupedByDate.map((group, index) =>
      <li key={`${instanceId}-message-group-${index}`}>
        {!isReverse && <h6 className={styles.dividerTitle}>
          <span>{group.title}</span>
        </h6>}
        <ul>
          {group.messages.map((message) => {
            return <ListItemComponent senderDetailStyle={senderDetailStyle} onClick={onMessageClick} message={message} key={`${instanceId}-message-${message.id}`} unreadMessageClassName={unreadMessageClassName} readMessageClassName={readMessageClassName}  />;
          })}
        </ul>
        {isReverse && <h6 className={`${styles.dividerTitle} ${styles.reverse}`}>
          <span>{group.title}</span>
        </h6>}
      </li>
    )}
    {!groupedByDate.length && <span className={styles.emptyMessage}>{emptyMessage}</span>}
  </InfiniteScroll>;
};

export default memo(MessageList);


/* today */
/* yesterday */
/* datee */