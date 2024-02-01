import React, { memo, useContext, useEffect, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import differenceInCalendarDays from 'date-fns/difference_in_calendar_days';
import Dropdown from 'react-bootstrap/Dropdown';
import Popover from 'react-bootstrap/Popover';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as BellIcon } from '../common/images/icons/bell-icon.svg';
import { ReactComponent as RefreshIcon } from '../common/images/icons/refresh-icon.svg';

import { fetchNews, readNews } from '../ducks/news';
import { MAIN_TOOLBAR_CATEGORY, trackEventFactory } from '../utils/analytics';
import { SocketContext } from '../withSocketConnection';
import { STATUSES } from '../constants';

import Badge from '../Badge';
import BadgeIcon from '../Badge';
import DateTime from '../DateTime';

import styles from './styles.module.scss';

const mainToolbarTracker = trackEventFactory(MAIN_TOOLBAR_CATEGORY);

const NOTIFICATION_REMINDER_DAYS_THRESHOLD = 7;
const NEWS_ITEM_CHARACTER_LIMIT = 200;

const formatUnreadNewsItemsAsNotifications = (news = []) => news.map(item => ({
  confirmText: 'Read more',
  date: item?.additional?.created_at,
  id: item.id,
  message: item.description,
  onConfirm: () => {
    const newWindow = window.open(item.link, '_blank', 'noopener,noreferrer');
    if (newWindow) {
      newWindow.opener = null;
    }
  },
  read: item.read,
  title: item.title,
}));

const NotificationItem = ({ item }) => {
  const { t } = useTranslation('top-bar', { keyPrefix: 'notificationMenu.notificationItem' });

  const isNewsItem = item.hasOwnProperty('read');
  const isUnread = isNewsItem && !item.read;

  let displayMessage = item.message.replace(/(<([^>]+)>)/ig, '').substring(0, NEWS_ITEM_CHARACTER_LIMIT);
  if (displayMessage.length === NEWS_ITEM_CHARACTER_LIMIT) {
    displayMessage += '...';
  }

  return <Dropdown.Item className={`${styles.item} ${isUnread ? styles.unread : ''}`} role="listitem">
    {item.title && <div className={styles.headerGroup}>
      {isUnread && <Badge className={styles.badge} status={STATUSES.UNHEALTHY_STATUS} />}

      <div>
        <h4 className={styles.title}>{item.title}</h4>

        {item.date && <DateTime className={styles.dateTime} date={item.date} showElapsed={false} />}
      </div>
    </div>}

    <h6>{displayMessage}</h6>

    {!!item.infolink && <div>
      <a
        href={item.infolink}
        onClick={(event) => event.stopPropagation()}
        rel="noopener noreferrer"
        target="_blank"
      >
        {t('moreInformationLink')}
      </a>
    </div>}

    <div className={styles.buttons}>
      {item.onDismiss && <Button
        className={styles.button}
        onClick={(event) => item.onDismiss(event, item)}
        size="sm"
        variant="secondary"
      >
        {t('dismissButton')}
      </Button>}

      {item.onConfirm && <Button
        className={styles.button}
        onClick={(event) => item.onConfirm(event, item)}
        size="sm"
        variant="info"
      >
        {item.confirmText || t('confirmButton')}
      </Button>}
    </div>
  </Dropdown.Item>;
};

const NotificationMenu = (props) => {
  const { t } = useTranslation('top-bar', { keyPrefix: 'notificationMenu' });

  const socket = useContext(SocketContext);

  const userNotifications = useSelector((state) => state.view.userNotifications || []);

  const menuRef = useRef(null);
  const toggleBtnRef = useRef(null);

  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [news, setNews] = useState(null);
  const [newsFetchError, setNewsFetchError] = useState(null);

  const notifications = [...userNotifications, ...(news || [])];

  const unreads = notifications.filter(n => !n.read);
  const unreadCount = unreads.length;

  const outdatedUnreadNotifications = unreads.filter((item) => !!item.date
    && differenceInCalendarDays(new Date(), new Date(item.date)) > NOTIFICATION_REMINDER_DAYS_THRESHOLD);

  const showOutdatedNotificationPopover = !!outdatedUnreadNotifications.length && !menuIsOpen;
  const outdatedNotificationString = showOutdatedNotificationPopover
    && t('outdatedNotifications', { count: unreadCount });

  const fetchNewsForMenu = () => {
    setNewsFetchError(null);
    fetchNews()
      .then(({ data: { data } }) => setNews(formatUnreadNewsItemsAsNotifications(data.results)))
      .catch((error) => setNewsFetchError(error));
  };

  const onClickRetryFetchNews = (event) => {
    event.preventDefault();
    event.stopPropagation();

    return fetchNewsForMenu();
  };

  const onToggle = (isOpen) => {
    mainToolbarTracker.track(`${isOpen ? 'Open' : 'Close'} Notification Menu`);

    setMenuIsOpen(isOpen);

    if (!isOpen) {
      const unreadNews = (news || []).filter(i => !i.read);
      if (!!unreadNews.length) {
        readNews(unreadNews)
          .then(() => {
            const newNews = news.map((n) => n.read ? n : { ...n, read: true });
            setNews(newNews);
          })
          .catch((error) => console.warn('error marking news as `read`', error));
      }
    } else {
      if (menuRef.current) {
        setTimeout(() => {
          menuRef.current.scrollTop = 0;
        });
      }
    }
  };

  useEffect(() => {
    fetchNewsForMenu();
  }, []);

  useEffect(() => {
    if (socket) {
      const consumeMessage = ({ data: msg }) => setNews([...formatUnreadNewsItemsAsNotifications([msg]), ...news]);

      const [, fnRef] = socket.on('new_announcement', consumeMessage);

      return () => socket.off('new_announcement', fnRef);
    }
  }, [news, socket]);

  return <Dropdown align="end" className={styles.dropdown} onToggle={onToggle} {...props}>
    <Dropdown.Toggle as="div" data-testid="notification-toggle" ref={toggleBtnRef}>
      <BellIcon className={`${styles.icon} ${!!notifications.length ? styles.activeIcon : ''}`} />

      {!!unreadCount && <BadgeIcon className={styles.badge} count={unreadCount} data-testid="unread-count" />}
    </Dropdown.Toggle>

    {showOutdatedNotificationPopover && <Popover
      className={styles.unreadNotificationsPopover}
      id="overlay-example"
      placement="bottom"
      role="alert"
      target={toggleBtnRef.current}
    >
      {outdatedNotificationString}
    </Popover>}

    <Dropdown.Menu className={styles.menu} ref={menuRef}>
      {!!notifications.length
        ? notifications.map((item, index) => <NotificationItem item={item} key={index} />)
        : <h6 className={styles.noItems}>{t('noNewNotificationsHeader')}</h6>}

      {!!news?.length && !newsFetchError && <>
        <Dropdown.Divider />

        <Dropdown.Item href="https://community.earthranger.com/tag/er-notify" rel="noreferrer" target="_blank">
          <Button style={{ marginLeft: 'auto' }} variant="link">{t('seeAllNewsButton')}</Button>
        </Dropdown.Item>
      </>}

      {newsFetchError && <>
        <Dropdown.Divider />

        <h6 className={styles.newsFetchErrorMessage} data-testid="error-message">
          {t('errorFetchingHeader')}

          <Button
            className={styles.button}
            data-testid="news-fetch-retry-btn"
            onClick={onClickRetryFetchNews}
            size="sm"
            variant="info"
          >
            <RefreshIcon />

            <span>{t('tryAgainButton')}</span>
          </Button>
        </h6>
      </>}
    </Dropdown.Menu>
  </Dropdown>;
};

export default memo(NotificationMenu);
