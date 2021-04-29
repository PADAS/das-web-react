
import React, { Fragment, memo }  from 'react';
import { connect } from 'react-redux';

import DateTime from '../DateTime';
import SenderDetails from './SenderDetails';

import { extractSubjectFromMessage } from '../utils/messaging';
import styles from './styles.module.scss';

const MessageListItem = (props) => {
  
  const { messageGroup, senderDetailStyle, onClick = () => null, subject, unreadMessageClassName, readMessageClassName, ...rest } = props;

  if (!subject) return null;

  const isOutgoing = messageGroup[0].message_type === 'outbox';

  return <li className={isOutgoing ? styles.outgoingMessage: styles.incomingMessage}>
    <SenderDetails subject={subject} message={messageGroup[0]} senderDetailStyle={senderDetailStyle} />
    <ul>
      {messageGroup.map((message) => {
        const handleClick = () => onClick(message);

        return <li key={message.id}  onClick={handleClick} {...rest}>
          <div className={`${styles.messageDetails} ${message.read ? readMessageClassName : unreadMessageClassName}`}>
            <span className={styles.messageContent}>{message.text}</span>
            <DateTime date={message.message_time} className={styles.messageTime} />
          </div>
        </li>;

      })}
    </ul>
  </li>;


  
};

const mapStateToProps = ({ data: { subjectStore } }, ownProps) => {
  const subject = ownProps.messageGroup && extractSubjectFromMessage(ownProps.messageGroup[0]);

  return {
    subject: subjectStore[subject.id],
  };


};

export default connect(mapStateToProps, null)(memo(MessageListItem));