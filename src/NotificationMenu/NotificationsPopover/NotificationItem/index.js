import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { STATUSES } from '../../../constants';

import Badge from '../../../Badge';
import DateTime from '../../../DateTime';

import * as styles from './styles.module.scss';

const HTML_TAG_REGEX = /(<([^>]+)>)/ig;
const MESSAGE_CHARACTER_LIMIT = 200;

const NotificationItem = ({ notification, onDismiss }) => {
  const { t } = useTranslation('top-bar', { keyPrefix: 'notificationMenu.notificationsPopover.notificationItem' });

  const titleId = useId();

  const hasActions = !!notification.link || !!notification.onConfirm || !!notification.onDismiss;
  // Only news carries a read state; the app's own notifications have none.
  const isUnread = notification.read === false;
  const plainMessage = notification.message.replace(HTML_TAG_REGEX, '');

  return <li className={styles.notificationItem}>
    {(!!notification.title || isUnread) && <div className={styles.header}>
      {isUnread && <>
        <Badge aria-hidden="true" className={styles.unreadDot} status={STATUSES.UNHEALTHY_STATUS} />

        <span className="sr-only">{t('unreadLabel')}</span>
      </>}

      {!!notification.title && <h2 className={styles.title} id={titleId}>{notification.title}</h2>}
    </div>}

    {!!notification.date && <DateTime className={styles.dateTime} date={notification.date} showElapsed={false} />}

    {!!plainMessage && <p className={styles.message}>
      {plainMessage.length > MESSAGE_CHARACTER_LIMIT
        ? `${plainMessage.substring(0, MESSAGE_CHARACTER_LIMIT)}...`
        : plainMessage}
    </p>}

    {!!notification.infolink && <a
      className={styles.infoLink}
      href={notification.infolink}
      rel="noopener noreferrer"
      target="_blank"
    >
      {t('moreInformationLink')}
    </a>}

    {hasActions && <div className={styles.actions}>
      {!!notification.onDismiss && <button
        className={styles.secondaryButton}
        onClick={(event) => onDismiss(event, notification)}
        type="button"
      >
        {t('dismissButton')}
      </button>}

      {!!notification.onConfirm && <button
        className={styles.primaryButton}
        onClick={(event) => notification.onConfirm(event, notification)}
        type="button"
      >
        {notification.confirmText ?? t('confirmButton')}
      </button>}

      {!!notification.link && <a
        aria-describedby={notification.title ? titleId : undefined}
        className={styles.secondaryButton}
        href={notification.link}
        rel="noopener noreferrer"
        target="_blank"
      >
        {t('readMoreLink')}
      </a>}
    </div>}
  </li>;
};

export default NotificationItem;
