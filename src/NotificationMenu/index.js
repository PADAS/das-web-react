import React, { memo, useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';

import { trackEvent } from '../utils/analytics';

import { ReactComponent as BellIcon } from '../common/images/icons/bell-icon.svg';
import BadgeIcon from '../Badge';

import styles from './styles.module.scss';

const { Toggle, Menu, Item } = Dropdown;

const formatUnreadNewsItemsAsNotifications = (news, onRead) => {
  return news.map(item => ({
    message: item.description,
    confirmText: 'Read more',
    onConfirm(_e, item) {
      onRead(item.id); 
    },
  })); 
  
};

const onShowMoreInfo = (e) => {
  e.stopPropagation();
};

const NotificationItem = (item, index) => {
  const { message, infolink, onConfirm, confirmText, onDismiss } = item;
  const handleConfirm = useCallback(e => onConfirm(e, item), [item, onConfirm]);
  const handleDismiss = useCallback(e => onDismiss(e, item), [item, onDismiss]);

  return <Item key={index} className={styles.item}>
    <h6>{message}</h6>
    {!!infolink && <div><a href={infolink} target='_blank' rel='noopener noreferrer' onClick={onShowMoreInfo}>More information</a></div>}
    <div className={styles.buttons}>
      {onDismiss && <Button size='sm' className={styles.button} variant='secondary' onClick={handleDismiss}>Dismiss</Button>}
      {onConfirm && <Button size='sm' className={styles.button} variant='info' onClick={handleConfirm}>{confirmText || 'Confirm'}</Button>}
    </div>

  </Item>;
};

const NotificationMenu = ({ userNotifications = [], newsItems = [], dispatch:_dispatch, ...rest }) => {
  const onToggle = (isOpen) => {
    trackEvent('Main Toolbar', `${isOpen ? 'Open' : 'Close'} Notification Menu`);
  };

  const notifications = useMemo(() => {
    return [...userNotifications];
  }, [userNotifications]);

  return <Dropdown onToggle={onToggle} alignRight className={styles.dropdown} {...rest}>
    <Toggle as="div">
      <BellIcon className={`${styles.icon} ${!!notifications.length ? styles.activeIcon : ''}`} />
      {!!notifications.length && <BadgeIcon className={styles.badge} count={notifications.length} />}
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
