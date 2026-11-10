import { useRef } from 'react';
import Popover from 'react-bootstrap/Popover';
import { useTranslation } from 'react-i18next';

import { ReactComponent as RefreshIcon } from '../../common/images/icons/refresh-icon.svg';

import useModalPopover from '../../hooks/useModalPopover';

import NotificationItem from './NotificationItem';

import * as styles from './styles.module.scss';

const ALL_NEWS_URL = 'https://community.earthranger.com/tag/er-notify';

const NotificationsPopover = ({
  className = '',
  hasNews,
  hasNewsFetchError,
  notifications,
  onClose,
  onRetryNewsFetch,
  ref,
  trigger,
  ...otherProps
}) => {
  const { t } = useTranslation('top-bar', { keyPrefix: 'notificationMenu.notificationsPopover' });

  const bodyRef = useRef(null);

  const { focusPopover, onKeyDown } = useModalPopover(bodyRef, trigger, onClose);

  // The dismiss and retry buttons leave with what they act on, so focus moves
  // on to the popover rather than dropping to the page.
  const onNotificationDismiss = (event, notification) => {
    notification.onDismiss(event, notification);

    focusPopover();
  };

  const onRetryButtonClick = () => {
    onRetryNewsFetch();

    focusPopover();
  };

  return <Popover
    aria-label={t('label')}
    aria-modal="true"
    className={`${styles.notificationsPopover} ${className}`}
    onKeyDown={onKeyDown}
    ref={ref}
    role="dialog"
    tabIndex={-1}
    {...otherProps}
  >
    <Popover.Body className={styles.body} ref={bodyRef}>
      {!!notifications.length && <ul className={styles.notificationList}>
        {notifications.map((notification) => <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={onNotificationDismiss}
        />)}
      </ul>}

      {!notifications.length && !hasNewsFetchError && <p className={styles.message}>
        {t('noNotificationsMessage')}
      </p>}

      {hasNewsFetchError && <div className={styles.newsFetchError}>
        <p className={styles.message}>{t('newsFetchErrorMessage')}</p>

        <button className={styles.retryButton} onClick={onRetryButtonClick} type="button">
          <RefreshIcon aria-hidden="true" />

          {t('retryButton')}
        </button>
      </div>}

      {hasNews && !hasNewsFetchError && <div className={styles.allNews}>
        <a className={styles.allNewsLink} href={ALL_NEWS_URL} rel="noopener noreferrer" target="_blank">
          {t('allNewsLink')}
        </a>
      </div>}
    </Popover.Body>
  </Popover>;
};

export default NotificationsPopover;
