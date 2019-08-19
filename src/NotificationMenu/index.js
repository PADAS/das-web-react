import React, { memo } from 'react';
import PropTypes from 'prop-types';
import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';

import { ReactComponent as BellIcon } from '../common/images/icons/bell-icon.svg';
import BadgeIcon from '../Badge';

import styles from './styles.module.scss';

const { Toggle, Menu, Item } = Dropdown;

const NotificationItem = (item, index) => {
  const { message, onConfirm, confirmText, onDismiss } = item;
  return <Item key={index} className={styles.item}>
    <h6>{message}</h6>
    <div className={styles.buttons}>
      <Button className={styles.button} variant='secondary' onClick={() => onDismiss(item)}>Dismiss</Button>
      {onConfirm && <Button className={styles.button} variant='info' onClick={() => onConfirm(item)}>{confirmText || 'Confirm'}</Button>}
    </div>

  </Item>;
};

const NotificationMenu = ({ notifications = [], ...rest }) => <Dropdown alignRight className={styles.dropdown} {...rest}>
  <Toggle as="div">
    <BellIcon className={styles.icon} />
    {!!notifications.length && <BadgeIcon className={styles.badge} count={notifications.length} />}
  </Toggle>
  <Menu className={styles.menu}>
    {!notifications.length && <h6 className={styles.noItems}>No new messages at this time.</h6>}
    {!!notifications.length && notifications.map(NotificationItem)}
  </Menu>
</Dropdown>;


export default memo(NotificationMenu);


NotificationMenu.propTypes = {
  notifications: PropTypes.array,
};

NotificationItem.propTypes = {
  item: PropTypes.shape({
    message: PropTypes.string.isRequired,
    onDismiss: PropTypes.func.isRequired,
    onConfirm: PropTypes.func,
    confirmText: PropTypes.func,
  }),
  index: PropTypes.number,
};