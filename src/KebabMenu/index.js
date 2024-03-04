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

// eslint-disable-next-line react/display-name
const Menu = forwardRef(({ children, className, ...rest }, ref) => (
  <Dropdown className={`${styles.kebabMenu} ${className}`} {...rest} >
    <Dropdown.Toggle as='button'>
      <KebabMenuIcon />
    </Dropdown.Toggle>
    <Dropdown.Menu ref={ref} className={styles.menuDropdown}>
      {children}
    </Dropdown.Menu>
  </ Dropdown>
));

Menu.defaultProps = {
  className: ''
};

Menu.propTypes = {
  children: PropTypes.element.isRequired,
  className: PropTypes.string
};

const KebabMenu = {
  ...Menu,
  Option: Option
};

export default KebabMenu;
