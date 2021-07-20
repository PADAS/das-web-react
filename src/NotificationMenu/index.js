import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';

import { fetchNews } from '../ducks/news';

import { trackEvent } from '../utils/analytics';

import { ReactComponent as BellIcon } from '../common/images/icons/bell-icon.svg';
import BadgeIcon from '../Badge';

import styles from './styles.module.scss';

const { Toggle, Menu, Item } = Dropdown;

const formatUnreadNewsItemsAsNotifications = (news = []) =>
  news
    .map(item => ({
      message: item.description,
      confirmText: 'Read more',
      onConfirm() {
        const newWindow = window.open(item.link, '_blank', 'noopener,noreferrer');
        if (newWindow) newWindow.opener = null;
      },
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

  const onToggle = (isOpen) => {
    trackEvent('Main Toolbar', `${isOpen ? 'Open' : 'Close'} Notification Menu`);
  };

  const notifications = useMemo(() => {
    return [...userNotifications, ...(news || [])];
  }, [news, userNotifications]);

  const unreadCount = userNotifications.length + (news || []).filter(n => !n.read).length;

  console.log('userNotifications.length', userNotifications.length);
  console.log('unread news length', (news || []).filter(n => !n.read).length);


  useEffect(() => {
    fetchNews()
      .then(({ data: { data } }) => {
        setNews(formatUnreadNewsItemsAsNotifications(data));
      })
      .catch((newsFetchError) => {
        console.log({ newsFetchError });
      });
  }, []);

  return <Dropdown onToggle={onToggle} alignRight className={styles.dropdown} {...rest}>
    <Toggle as='div' data-testid='notification-toggle'>
      <BellIcon className={`${styles.icon} ${!!notifications.length ? styles.activeIcon : ''}`} />
      {!!unreadCount && <BadgeIcon data-testid='unread-count' className={styles.badge} count={unreadCount} />}
    </Toggle>
    <Menu className={styles.menu}>
      {!notifications.length && <h6 className={styles.noItems}>No new notifications at this time.</h6>}
      {!!notifications.length && notifications.map(NotificationItem)}
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
