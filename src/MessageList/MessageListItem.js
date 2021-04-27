
import React, { memo }  from 'react';
import { connect } from 'react-redux';

import DateTime from '../DateTime';

import { isRadioWithImage } from '../utils/subjects';
import { calcSenderNameForMessage, extractSubjectFromMessage } from '../utils/messaging';
import styles from './styles.module.scss';

const MessageListItem = (props) => {
  
  const { message, onClick = () => null, subject, unreadMessageClassName, readMessageClassName, ...rest } = props;

  const radioImage = isRadioWithImage(subject);

  const handleClick = () => onClick(message);

  if (!subject) return null;

  return  <li className={message.message_type === 'inbox' ? styles.incomingMessage : styles.outgoingMessage} onClick={handleClick} {...rest}>
    <em className={styles.senderDetails}>{message.message_type === 'inbox' ? subject.name : `${calcSenderNameForMessage(message)} > ${subject.name}`}</em>
    <div className={styles.messageContentWrapper}>
      {radioImage && <img src={radioImage} alt={`Radio icon for ${subject.name}`} />}
      <div className={`${styles.messageDetails} ${message.read ? readMessageClassName : unreadMessageClassName}`}>
        <span className={styles.messageContent}>{message.text}</span>
        <DateTime date={message.message_time} className={styles.messageTime} />
      </div>
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