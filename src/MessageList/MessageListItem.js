
import React, { memo }  from 'react';
import { connect } from 'react-redux';

import DateTime from '../DateTime';
import SenderDetails from './SenderDetails';

import { extractSubjectFromMessage } from '../utils/messaging';
import styles from './styles.module.scss';

const MessageListItem = (props) => {
  
  const { message, senderDetailStyle, onClick = () => null, subject, unreadMessageClassName, readMessageClassName, ...rest } = props;

  const isOutgoing = message.message_type === 'outbox';

  const handleClick = () => onClick(message);

  if (!subject) return null;

  return  <li className={isOutgoing ? styles.outgoingMessage: styles.incomingMessage} onClick={handleClick} {...rest}>
    <SenderDetails subject={subject} message={message} senderDetailStyle={senderDetailStyle} />
    <div className={`${styles.messageDetails} ${message.read ? readMessageClassName : unreadMessageClassName}`}>
      <span className={styles.messageContent}>{message.text}</span>
      <DateTime date={message.message_time} className={styles.messageTime} />
    </div>
  </li>;
};

const mapStateToProps = ({ data: { subjectStore } }, ownProps) => {
  const subject = ownProps.message && extractSubjectFromMessage(ownProps.message);

  return {
    subject: subjectStore[subject.id],
  };


};

export default connect(mapStateToProps, null)(memo(MessageListItem));