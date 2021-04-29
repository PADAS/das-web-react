
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

const MessageSummaryListItem = (props) => {
  
  const { messageGroup, senderDetailStyle = SENDER_DETAIL_STYLES.SUBJECT, unreadMessageClassName, readMessageClassName, onClick = () => null, subjectStore, ...rest } = props;


  return messageGroup.map((message) => {
    const isOutgoing = message.message_type === 'outbox';
    const handleClick = () => onClick(message);
    const messageSubject = extractSubjectFromMessage(message);
    const subject = subjectStore[messageSubject.id];

    if (!subject) return null;
    
    const radioImage = isRadioWithImage(subject) || calcUrlForImage(subject.image_url);

    return <li key={message.id} className={`${isOutgoing ? styles.outgoingMessage : styles.incomingMessage} ${radioImage ? styles.hasImage : ''}`} onClick={handleClick} {...rest}>
      <SenderDetails subject={subject} message={message} senderDetailStyle={senderDetailStyle} />
      <div className={`${styles.messageDetails} ${message.read ? readMessageClassName : unreadMessageClassName}`}>
        {!message.read && <Badge className={styles.badge} status={STATUSES.UNHEALTHY_STATUS} />}
        <span className={`${styles.messageContent} ${isOutgoing ? styles.outgoing : styles.incoming}`}>{isOutgoing ? `${calcSenderNameForMessage(message)}: `: ''}{message.text}</span>
        <DateTime date={message.message_time} className={styles.messageTime} />
      </div>
    </li>;

  }
  ) ;
};

const mapStateToProps = ({ data: { subjectStore } }, ownProps) => ({
  subjectStore,
});

export default connect(mapStateToProps, null)(memo(MessageSummaryListItem));
