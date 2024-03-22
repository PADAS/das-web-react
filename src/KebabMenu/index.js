import React, { forwardRef } from 'react';
import { Dropdown } from 'react-bootstrap';
import PropTypes from 'prop-types';

import KebabMenuIcon from '../KebabMenuIcon';

import styles from './styles.module.scss';

const Option = ({ className = '', children, ...rest }) => (
  <Dropdown.Item className={`${styles.itemBtn} ${className}`} {...rest}>
    {children}
  </Dropdown.Item>
);

const Menu = ({ children, className, ...rest }, ref) => (
  <Dropdown className={`${styles.kebabMenu} ${className}`} {...rest} >
    <Dropdown.Toggle as='button'>
      <KebabMenuIcon />
    </Dropdown.Toggle>
    <Dropdown.Menu ref={ref} className={styles.menuDropdown}>
      {children}
    </Dropdown.Menu>
  </ Dropdown>
);

const MenuForwardRef = forwardRef(Menu);

MenuForwardRef.defaultProps = {
  className: ''
};

MenuForwardRef.propTypes = {
  children: PropTypes.oneOfType([PropTypes.array, PropTypes.element]).isRequired,
  className: PropTypes.string
};

const KebabMenu = {
  ...MenuForwardRef,
  Option: Option
};

export default KebabMenu;
