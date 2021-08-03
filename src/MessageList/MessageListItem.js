
import React, { useContext, memo }  from 'react';
import { connect } from 'react-redux';
import uniq from 'lodash/uniq';

import { MapContext } from '../App';
import DateTime from '../DateTime';
import SenderDetails from './SenderDetails';
import LocationJumpButton from '../LocationJumpButton';

import { extractSubjectFromMessage } from '../utils/messaging';
import { jumpToLocation } from '../utils/map';
import { fetchTracksIfNecessary } from '../utils/tracks';
import { toggleTrackState } from '../ducks/map-ui';
import { showPopup } from '../ducks/popup';

import { ReactComponent as PendingIcon } from '../common/images/icons/pending-message-icon.svg';
import { ReactComponent as SentIcon } from '../common/images/icons/sent-message-icon.svg';
import { ReactComponent as ReceivedIcon } from '../common/images/icons/received-message-icon.svg';
import { ReactComponent as FailedIcon } from '../common/images/icons/failed-message-icon.svg';

import styles from './styles.module.scss';

const MESSAGE_STATUSES = {
  RECEIVED: 'received',
  FAILED: 'failed',
  PENDING: 'pending',
  SENT: 'sent',
};

const MESSAGE_ICON_MAP = {
  [MESSAGE_STATUSES.RECEIVED]: ReceivedIcon,
  [MESSAGE_STATUSES.SENT]: SentIcon,
  [MESSAGE_STATUSES.PENDING]: PendingIcon,
  [MESSAGE_STATUSES.FAILED]: FailedIcon,
};

const MessageListItem = (props) => {
  
  const { currentPopup, messageGroup, senderDetailStyle, onMessageSubjectClick, onClick = () => null,
    showPopup, subject, subjectTrackState, toggleTrackState, unreadMessageClassName, readMessageClassName, ...rest } = props;
  const map = useContext(MapContext);

  if (!subject) return null;

  const isOutgoing = messageGroup[0].message_type === 'outbox';

  return <li className={isOutgoing ? styles.outgoingMessage: styles.incomingMessage}>
    <SenderDetails subject={subject} message={messageGroup[0]} senderDetailStyle={senderDetailStyle} onMessageSubjectClick={onMessageSubjectClick} />
    <ul>
      {messageGroup.map((message) => {
        const handleClick = () => onClick(message);

        const StatusIcon = MESSAGE_ICON_MAP[message.status];

        const onJumpButtonClick = async () => {
          jumpToLocation(map, [message.device_location.longitude, message.device_location.latitude]);

          const subjectTrackHidden = !uniq([...subjectTrackState.visible, ...subjectTrackState.pinned]).includes(subject.id);
          if (subjectTrackHidden) {
            await fetchTracksIfNecessary([subject.id]);
            toggleTrackState(subject.id);
          }
          const coordinates = [message.device_location.longitude, message.device_location.latitude];

          showPopup('subject-message', { subject, message, coordinates });
        };
        

        return <li key={message.id}  onClick={handleClick} {...rest}>
          <div className={`${styles.messageDetails} ${message.read ? readMessageClassName : unreadMessageClassName}`}>
            <span className={styles.messageContent}>{message.text}</span>
            <div className={styles.messageMetaData} title={message.status}>
              {!!StatusIcon && <StatusIcon className={styles.messageStatusIcon}  />}
              <DateTime date={message.message_time} className={styles.messageTime} />
            </div>
          </div>
          {message.device_location && <LocationJumpButton bypassLocationValidation={true} onClick={onJumpButtonClick} />} 
        </li>;

      })}
    </ul>
  </li>;


  
};

const mapStateToProps = ({ data: { subjectStore }, view: { popup, subjectTrackState } }, ownProps) => {
  const subject = ownProps.messageGroup && extractSubjectFromMessage(ownProps.messageGroup[0]);

  return {
    currentPopup: popup,
    subject: subjectStore[subject.id],
    subjectTrackState,
  };
};

export default connect(mapStateToProps, { showPopup, toggleTrackState })(memo(MessageListItem));