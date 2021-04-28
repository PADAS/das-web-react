
import React, { Fragment, memo }  from 'react';
import { connect } from 'react-redux';

import DateTime from '../DateTime';
import { ReactComponent as UserIcon } from '../common/images/icons/solid-user-icon.svg';

import { isRadioWithImage } from '../utils/subjects';
import { calcSenderNameForMessage, extractSubjectFromMessage } from '../utils/messaging';
import styles from './styles.module.scss';

const MessageListItem = (props) => {
  
  const { message, onClick = () => null, subject, unreadMessageClassName, readMessageClassName, ...rest } = props;

  const radioImage = isRadioWithImage(subject) || subject.image_url;
  const isOutgoing = message.message_type === 'outbox';

  const handleClick = () => onClick(message);

  if (!subject) return null;

  return  <li className={isOutgoing ? styles.outgoingMessage: styles.incomingMessage} onClick={handleClick} {...rest}>
    <em className={styles.senderDetails}>
      {isOutgoing && message?.sender?.content_type === 'accounts.user' && <UserIcon />}
      {isOutgoing &&`${calcSenderNameForMessage(message)} > `}
      {radioImage && <img src={radioImage} alt={`Radio icon for ${subject.name}`} />}
      {subject.name}
    </em>
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