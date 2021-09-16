import React, { Fragment, memo } from 'react';

import { ReactComponent as UserIcon } from '../common/images/icons/solid-user-icon.svg';

import { isRadioWithImage } from '../utils/subjects';
import { calcSenderNameForMessage } from '../utils/messaging';
import { calcUrlForImage } from '../utils/img';
import styles from './styles.module.scss';

export const SENDER_DETAIL_STYLES = {
  FULL: 'full',
  SUBJECT: 'subject',
  SHORT: 'short',
  NONE: 'none',
};

const SenderDetails = (props) => {
  const { message, onMessageSubjectClick, senderDetailStyle, subject } = props;

  const onClickSubjectName = () => {
    if (!onMessageSubjectClick) return null;
    return onMessageSubjectClick(subject);
  };

  const radioImage = isRadioWithImage(subject) || calcUrlForImage(subject.image_url);
  const isOutgoing = message.message_type === 'outbox';

  if (senderDetailStyle === SENDER_DETAIL_STYLES.FULL) return <em className={styles.senderDetails}>
    {isOutgoing && <span>
      {message?.sender?.content_type === 'accounts.user' && <UserIcon />}
      {`${calcSenderNameForMessage(message)} > `}
    </span>}
    <span className={`${styles.messageSubjectName} ${!!onMessageSubjectClick ? styles.clickable : ''}`} onClick={onClickSubjectName}>{radioImage && <img src={radioImage} alt={`Radio icon for ${subject.name}`} />}
      {subject.name}</span>
  </em>;

  if (senderDetailStyle === SENDER_DETAIL_STYLES.SHORT) return <em className={styles.senderDetails}>
    {isOutgoing && <Fragment>
      {message?.sender?.content_type === 'accounts.user' && <UserIcon />}
      {calcSenderNameForMessage(message)}
    </Fragment>}
    {!isOutgoing && <Fragment>
      <span className={`${styles.messageSubjectName} ${!!onMessageSubjectClick ? styles.clickable : ''}`} onClick={onClickSubjectName}>
        {radioImage && <img src={radioImage} alt={`Radio icon for ${subject.name}`} />}
        {subject.name}
      </span>
    </Fragment>}
  </em>;

  if (senderDetailStyle === SENDER_DETAIL_STYLES.SUBJECT) return <em className={styles.senderDetails}>
    <span className={`${styles.messageSubjectName} ${!!onMessageSubjectClick ? styles.clickable : ''}`} onClick={onClickSubjectName}>
      {radioImage && <img src={radioImage} alt={`Radio icon for ${subject.name}`} />}
      {subject.name}
    </span>
  </em>;

  return null;
};

export default memo(SenderDetails);