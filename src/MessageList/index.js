import React, { forwardRef, memo, useMemo, useRef, useState } from 'react';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';
import isSameDay from 'date-fns/is_same_day';
import isToday from 'date-fns/is_today';
import isYesterday from 'date-fns/is_yesterday';

import InfiniteScroll from 'react-infinite-scroller';

import format from 'date-fns/format';

import { SHORTENED_DATE_FORMAT } from '../utils/datetime';
import { uuid } from '../utils/string';
import { extractSubjectFromMessage } from '../utils/messaging';

import DateTime from '../DateTime';

import styles from './styles.module.scss';

const calcMessageGroupTitle = (date) => {
  if (isToday(date)) return 'today';
  if (isYesterday(date)) return 'yesterday';
  return format(date, SHORTENED_DATE_FORMAT);
};

const MessageList = forwardRef((props, ref = useRef() ) => { /* eslint-disable-line react/display-name */
  const { className = '', hasMore = false, onScroll = () => null, messages = [], } = props;

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

  return   <InfiniteScroll
    element='ul'
    hasMore={hasMore}
    loadMore={onScroll}
    className={`${styles.messageHistory} ${className}`}
    useWindow={false}
    getScrollParent={() => findDOMNode(ref.current)} // eslint-disable-line react/no-find-dom-node 
  >
    {!!groupedByDate.length && groupedByDate.map((group, index) =>
      <MessageGroupListItem key={`${instanceId}-message-group-${index}`}
        messages={group.messages} title={group.title} />
    )}
    {!groupedByDate.length && <span>No messages to display.</span>}
  </InfiniteScroll>;
});


const MessageGroupListItem = (props) => {
  const { instanceId, title, messages } = props;
  return <li>
    <ul>
      {messages.map(message => 
        <MessageListItem message={message} key={`${instanceId}-message-${message.id}`}  />
      )}
    </ul>
    <h6 className={styles.dividerTitle}>
      <span>{title}</span>
    </h6>
  </li>;
};

const MessageListItem = (props) => {
  const { message } = props;
  const subject = extractSubjectFromMessage(message);

  if (!subject) return null;

  return  <li className={message.message_type === 'inbox' ? styles.incomingMessage : styles.outgoingMessage}>
    <em className={styles.senderDetails}>{message.message_type === 'inbox' ? subject.name : `${message?.sender?.name ?? 'Operator'} > ${subject.name}`}</em>
    <div className={`${styles.messageDetails} ${message.read ? '' : styles.unread}`}>
      <span className={styles.messageContent}>{message.text}</span>
      <DateTime date={message.message_time} className={styles.messageTime} />
    </div>
  </li>;
};

export default memo(MessageList);


/* today */
/* yesterday */
/* datee */