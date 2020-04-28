import React, { memo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';

import { trackEvent } from '../utils/analytics';

import { ReactComponent as BellIcon } from '../common/images/icons/bell-icon.svg';
import BadgeIcon from '../Badge';

import styles from './styles.module.scss';

const { Toggle, Menu, Item } = Dropdown;

const NotificationItem = (item, index) => {
  const { message, onConfirm, confirmText, onDismiss } = item;
  return <Item key={index} className={styles.item}>
    <h6>{message}</h6>
    <div className={styles.buttons}>
      <Button className={styles.button} variant='secondary' onClick={(e) => onDismiss(e, item)}>Dismiss</Button>
      {onConfirm && <Button className={styles.button} variant='info' onClick={(e) => onConfirm(e, item)}>{confirmText || 'Confirm'}</Button>}
    </div>

  </Item>;
};

const NotificationMenu = ({ notifications = [], dispatch:_dispatch, ...rest }) => {
  const onToggle = (isOpen) => {
    trackEvent('Main Toolbar', `${isOpen ? 'Open' : 'Close'} Notification Menu`);
  };

  return <Dropdown onToggle={onToggle} alignRight className={styles.dropdown} {...rest}>
    <Toggle as="div">
      <BellIcon className={`${styles.icon} ${!!notifications.length ? styles.activeIcon : ''}`} />
      {!!notifications.length && <BadgeIcon className={styles.badge} count={notifications.length} />}
    </Toggle>
    <Menu className={styles.menu}>
      {!notifications.length && <h6 className={styles.noItems}>No new messages at this time.</h6>}
      {!!notifications.length && notifications.map(NotificationItem)}
    </Menu>
  </Dropdown>;

};

const mapStateToProps = ({ view: { userNotifications } }) => ({ notifications:userNotifications });
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
