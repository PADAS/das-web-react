import React, { Fragment, memo, useContext, useRef, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Popover from 'react-bootstrap/Popover';
import pluralize from 'pluralize';

import differenceInCalendarDays from 'date-fns/difference_in_calendar_days';

import Badge from '../Badge';
import DateTime from '../DateTime';

import { SocketContext } from '../withSocketConnection';

import { fetchNews, readNews } from '../ducks/news';

import { trackEvent } from '../utils/analytics';

import { ReactComponent as BellIcon } from '../common/images/icons/bell-icon.svg';
import { ReactComponent as RefreshIcon } from '../common/images/icons/refresh-icon.svg';
import BadgeIcon from '../Badge';

import { STATUSES } from '../constants';

import styles from './styles.module.scss';

const NOTIFICATION_REMINDER_AGE_THRESHOLD = 7; // days
const NEWS_ITEM_CHARACTER_LIMIT = 200;

const { Divider, Toggle, Menu, Item } = Dropdown;

const formatUnreadNewsItemsAsNotifications = (news = []) =>
  news
    .map(item => ({
      id: item.id,
      message: item.description,
      confirmText: 'Read more',
      date: item?.additional?.created_at,
      title: item.title,
      onConfirm() {
        const newWindow = window.open(item.link, '_blank', 'noopener,noreferrer');
        if (newWindow) newWindow.opener = null;
      },
      read: item.read,
    }));

const onShowMoreInfo = (e) => {
  e.stopPropagation();
};


const NotificationItem = (item, index) => {
  const { message, infolink, onConfirm, confirmText, onDismiss } = item;
  const handleConfirm = e => onConfirm(e, item);
  const handleDismiss = e => onDismiss(e, item);

  const isNewsItem = item.hasOwnProperty('read');
  const isUnread = isNewsItem && !item.read;

  let displayMessage = message.replace(/(<([^>]+)>)/ig, '').substring(0, NEWS_ITEM_CHARACTER_LIMIT);
  if (displayMessage.length === NEWS_ITEM_CHARACTER_LIMIT) {
    displayMessage += '...';
  }

  return <Item key={index} className={`${styles.item} ${isUnread ? styles.unread : ''}`} role='listitem'>
    {item.title && <div className={styles.headerGroup}>
      {isUnread && <Badge className={styles.badge} status={STATUSES.UNHEALTHY_STATUS} />}
      <div>
        <h4 className={styles.title}>
          {item.title}
        </h4>
        {item.date && <DateTime className={styles.dateTime} date={item.date} showElapsed={false} />}
      </div>
    </div>}

    <h6>{displayMessage}</h6>
    {!!infolink && <div><a href={infolink} target='_blank' rel='noopener noreferrer' onClick={onShowMoreInfo}>More information</a></div>}
    <div className={styles.buttons}>
      {onDismiss && <Button size='sm' className={styles.button} variant='secondary' onClick={handleDismiss}>Dismiss</Button>}
      {onConfirm && <Button size='sm' className={styles.button} variant='info' onClick={handleConfirm}>{confirmText || 'Confirm'}</Button>}
    </div>

  </Item>;
};

const NotificationMenu = ({ userNotifications = [], newsItems = [], dispatch: _dispatch, ...rest }) => {
  const [news, setNews] = useState(null);
  const [newsFetchError, setNewsFetchError] = useState(null);
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const menuRef = useRef(null);
  const toggleBtnRef = useRef(null);
  const socket = useContext(SocketContext);


  const fetchNewsForMenu = () => {
    setNewsFetchError(null);
    fetchNews()
      .then(({ data: { data } }) => {
        setNews(formatUnreadNewsItemsAsNotifications(data.results));
      })
      .catch((error) => {
        setNewsFetchError(error);
      });
  };

  const onClickRetryFetchNews = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return fetchNewsForMenu();
  };

  const onToggle = (isOpen) => {
    trackEvent('Main Toolbar', `${isOpen ? 'Open' : 'Close'} Notification Menu`);

    setMenuIsOpen(isOpen);

    if (!isOpen) {
      const unreadNews = (news || []).filter(i => !i.read);
      if (!!unreadNews.length) {
        readNews(unreadNews)
          .then(() => {
            const newNews = news.map(n => n.read ? n : { ...n, read: true });
            setNews(newNews);
          })
          .catch((error) => {
            console.warn('error marking news as `read`', error);
          });
      }
    } else {
      if (menuRef.current) {
        setTimeout(() => {
          menuRef.current.scrollTop = 0;
        });
      }
    }
  };

  const notifications = [...userNotifications, ...(news || [])];

  const unreads = notifications.filter(n => !n.read);
  const unreadCount = unreads.length;

  const outdatedUnreadNotifications = unreads
    .filter(item =>
      !!item.date
      && differenceInCalendarDays(new Date(), new Date(item.date)) > NOTIFICATION_REMINDER_AGE_THRESHOLD
    );

  const showOutdatedNotificationPopover = !!outdatedUnreadNotifications.length && !menuIsOpen;
  const outdatedNotificationString = showOutdatedNotificationPopover && `You have ${unreadCount} ${pluralize('notification', unreadCount)}`;

  useEffect(() => {
    fetchNewsForMenu();
  }, []);

  useEffect(() => {
    if (socket) {
      const consumeMessage = ({ data: msg }) => {
        return setNews([...formatUnreadNewsItemsAsNotifications([msg]), ...news]);
      };

      socket.on('new_announcement', consumeMessage);

      return () => {
        socket.off('new_announcement', consumeMessage);
      };
    }
  }, [news, socket]);

  return <Dropdown onToggle={onToggle} alignRight className={styles.dropdown} {...rest}>
    <Toggle ref={toggleBtnRef} as='div' data-testid='notification-toggle'>
      <BellIcon className={`${styles.icon} ${!!notifications.length ? styles.activeIcon : ''}`} />
      {!!unreadCount && <BadgeIcon data-testid='unread-count' className={styles.badge} count={unreadCount} />}
    </Toggle>
    {showOutdatedNotificationPopover && <Popover className={styles.unreadNotificationsPopover} placement='bottom' target={toggleBtnRef.current} role='alert' id='overlay-example' >
      {outdatedNotificationString}
    </Popover>}
    <Menu className={styles.menu} ref={menuRef}>
      {!notifications.length && <h6 className={styles.noItems}>No new notifications at this time.</h6>}
      {!!notifications.length && notifications.map(NotificationItem)}
      {!!news?.length && !newsFetchError && <Fragment>
        <Divider />
        <Item href='https://community.earthranger.com/tag/er-notify' rel='noreferrer' target='_blank'><Button variant='link' style={{ marginLeft: 'auto' }}>See all news &gt;</Button></Item>
      </Fragment>
      }
      {newsFetchError && <Fragment>
        <Divider />
        <h6 data-testid='error-message' className={styles.newsFetchErrorMessage}>Error fetching recent announcements.
          <Button data-testid='news-fetch-retry-btn' size='sm' className={styles.button} variant='info' onClick={onClickRetryFetchNews}>
            <RefreshIcon />
            <span>Try again</span>
          </Button>
        </h6></Fragment>}
    </Menu>
  </Dropdown>;

};

const mapStateToProps = ({ view: { userNotifications } }) => ({ userNotifications });
export default connect(mapStateToProps, null)(memo(NotificationMenu));

NotificationMenu.propTypes = {
  notifications: PropTypes.arrayOf(
    PropTypes.shape({
      message: PropTypes.string.isRequired,
      onDismiss: PropTypes.func.isRequired,
      onConfirm: PropTypes.func,
      confirmText: PropTypes.string,
    })
  ),
};
