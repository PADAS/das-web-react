import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as UserIcon } from '../common/images/icons/solid-user-icon.svg';

import { calcSenderNameForMessage } from '../utils/messaging';
import { calcUrlForImage } from '../utils/img';
import { isRadioWithImage, subjectIsStatic } from '../utils/subjects';

import styles from './styles.module.scss';

export const SENDER_DETAIL_STYLES = {
  FULL: 'full',
  SUBJECT: 'subject',
  SHORT: 'short',
  NONE: 'none',
};

const SenderDetails = ({ message, onMessageSubjectClick, senderDetailStyle, subject }) => {
  const { t } = useTranslation('components', { keyPrefix: 'messageList.senderDetails' });

  const iconStyles = subjectIsStatic(subject) ? { filter: 'brightness(0.3)' } : {};
  const isOutgoing = message.message_type === 'outbox';
  const radioImage = isRadioWithImage(subject) || calcUrlForImage(subject.image_url);

  if (senderDetailStyle === SENDER_DETAIL_STYLES.FULL) {
    return <em className={styles.senderDetails}>
      {isOutgoing && <span>
        {message?.sender?.content_type === 'accounts.user' && <UserIcon />}

        {`${calcSenderNameForMessage(message)} > `}
      </span>}

      <span
        className={`${styles.messageSubjectName} ${!!onMessageSubjectClick ? styles.clickable : ''}`}
        onClick={() => onMessageSubjectClick?.(subject)}
      >
        {radioImage && <img
          alt={t('radioIconTitle', { subjectName: subject.name })}
          src={radioImage}
          style={iconStyles}
        />}

        {subject.name}
      </span>
    </em>;
  }

  if (senderDetailStyle === SENDER_DETAIL_STYLES.SHORT) {
    return <em className={styles.senderDetails}>
      {isOutgoing
        ? <>
          {message?.sender?.content_type === 'accounts.user' && <UserIcon />}

          {calcSenderNameForMessage(message)}
        </>
        : <span
            className={`${styles.messageSubjectName} ${!!onMessageSubjectClick ? styles.clickable : ''}`}
            onClick={() => onMessageSubjectClick?.(subject)}
          >
          {radioImage && <img
            alt={t('radioIconTitle', { subjectName: subject.name })}
            src={radioImage}
            style={iconStyles}
          />}

          {subject.name}
        </span>}
    </em>;
  }

  if (senderDetailStyle === SENDER_DETAIL_STYLES.SUBJECT) {
    return <em className={styles.senderDetails}>
      <span
        className={`${styles.messageSubjectName} ${!!onMessageSubjectClick ? styles.clickable : ''}`}
        onClick={() => onMessageSubjectClick?.(subject)}
      >
        {radioImage && <img
          alt={t('radioIconTitle', { subjectName: subject.name })}
          src={radioImage}
          style={iconStyles}
        />}

        {subject.name}
      </span>
    </em>;
  }

  return null;
};

export default memo(SenderDetails);
