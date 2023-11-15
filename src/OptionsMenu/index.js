import React, { forwardRef } from 'react';
import { Dropdown } from 'react-bootstrap';

import KebabMenuIcon from '../KebabMenuIcon';

import styles from './styles.module.scss';


export const Option = ({ className = '', children, ...rest }) => {
  return <Dropdown.Item className={`${styles.itemBtn} ${className}`} {...rest}>
    {children}
  </Dropdown.Item>;
};

const OptionsMenu = ({ children, ...rest }, ref) => {
  return <Dropdown className={styles.kebabMenu} {...rest}>
    <Dropdown.Toggle as='button'>
      <KebabMenuIcon />
    </Dropdown.Toggle>
    <Dropdown.Menu ref={ref} className={styles.menuDropdown}>
      {children}
    </Dropdown.Menu>
  </ Dropdown>;
};

export default forwardRef(OptionsMenu);
