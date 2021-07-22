import React, { Fragment, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';

import { fetchNews, readNews } from '../ducks/news';

import { trackEvent } from '../utils/analytics';

import { ReactComponent as BellIcon } from '../common/images/icons/bell-icon.svg';
import { ReactComponent as RefreshIcon } from '../common/images/icons/refresh-icon.svg';
import BadgeIcon from '../Badge';

import styles from './styles.module.scss';

const NEWS_FETCH_PARAMS = {
  page_size: 10,
};

const { Divider, Toggle, Menu, Item } = Dropdown;

const formatUnreadNewsItemsAsNotifications = (news = []) =>
  news
    .map(item => ({
      id: item.id,
      message: item.description,
      confirmText: 'Read more',
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

  return <Item key={index} className={styles.item} role='listitem'>
    <h6>{message}</h6>
    {!!infolink && <div><a href={infolink} target='_blank' rel='noopener noreferrer' onClick={onShowMoreInfo}>More information</a></div>}
    <div className={styles.buttons}>
      {onDismiss && <Button size='sm' className={styles.button} variant='secondary' onClick={handleDismiss}>Dismiss</Button>}
      {onConfirm && <Button size='sm' className={styles.button} variant='info' onClick={handleConfirm}>{confirmText || 'Confirm'}</Button>}
    </div>

  </Item>;
};

const NotificationMenu = ({ userNotifications = [], newsItems = [], dispatch:_dispatch, ...rest }) => {
  const [news, setNews] = useState(null);
  const [newsFetchError, setNewsFetchError] = useState(null);


  const fetchNewsForMenu = () => {
    setNewsFetchError(null);
    fetchNews()
      .then(({ data: { data } }) => {
        setNews(formatUnreadNewsItemsAsNotifications(data.results));
        throw new Error('balls');
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
    }
  };

  const goToCommunityPage = () => {
    const newWindow = window.open('https://community.earthranger.com/tag/er-notify', '_blank', 'noopener,noreferrer');
    if (newWindow) newWindow.opener = null;
  };

  const notifications = useMemo(() => {
    return [...userNotifications, ...(news || [])];
  }, [news, userNotifications]);

  const unreadCount = userNotifications.length + (news || []).filter(n => !n.read).length;

  useEffect(() => {
    fetchNewsForMenu();
  }, []);

  return <Dropdown onToggle={onToggle} alignRight className={styles.dropdown} {...rest}>
    <Toggle as='div' data-testid='notification-toggle'>
      <BellIcon className={`${styles.icon} ${!!notifications.length ? styles.activeIcon : ''}`} />
      {!!unreadCount && <BadgeIcon data-testid='unread-count' className={styles.badge} count={unreadCount} />}
    </Toggle>
    <Menu className={styles.menu}>
      {!notifications.length && <h6 className={styles.noItems}>No new notifications at this time.</h6>}
      {!!notifications.length && notifications.map(NotificationItem)}
      {!!news?.length && !newsFetchError && <Item onClick={goToCommunityPage}><a href={'https://community.earthranger.com/tag/er-notify'} rel='noreferrer' target='_blank'>See all news</a></Item>}
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
