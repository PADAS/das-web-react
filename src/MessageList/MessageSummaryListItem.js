
import React, { memo }  from 'react';
import { connect } from 'react-redux';
import { STATUSES } from '../constants';

import DateTime from '../DateTime';
import SenderDetails, { SENDER_DETAIL_STYLES } from './SenderDetails';
import Badge from '../Badge';

import { calcSenderNameForMessage, extractSubjectFromMessage } from '../utils/messaging';
import { isRadioWithImage } from '../utils/subjects';
import { calcUrlForImage } from '../utils/img';

import styles from './styles.module.scss';

const MessageListItem = (props) => {
  
  const { message, senderDetailStyle = SENDER_DETAIL_STYLES.SUBJECT, subject, unreadMessageClassName, readMessageClassName, onClick = () => null, ...rest } = props;
  const radioImage = isRadioWithImage(subject) || calcUrlForImage(subject.image_url);

  const isOutgoing = message.message_type === 'outbox';

  const handleClick = () => onClick(message);

  if (!subject) return null;

  return  <li className={`${isOutgoing ? styles.outgoingMessage : styles.incomingMessage} ${radioImage ? styles.hasImage : ''}`} onClick={handleClick} {...rest}>
    <SenderDetails subject={subject} message={message} senderDetailStyle={senderDetailStyle} />
    <div className={`${styles.messageDetails} ${message.read ? readMessageClassName : unreadMessageClassName}`}>
      {!message.read && <Badge className={styles.badge} status={STATUSES.UNHEALTHY_STATUS} />}
      <span className={`${styles.messageContent} ${isOutgoing ? styles.outgoing : styles.incoming}`}>{isOutgoing ? `${calcSenderNameForMessage(message)}: `: ''}{message.text}</span>
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
