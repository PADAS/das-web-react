import React, { forwardRef } from 'react';
import { Dropdown } from 'react-bootstrap';

import KebabMenuIcon from '../KebabMenuIcon';

import styles from './styles.module.scss';

const { Toggle, Menu, Item } = Dropdown;

export const Option = ({ className = '', children, ...rest }) => {
  return <Item className={`${styles.itemBtn} ${className}`} {...rest}>
    {children}
  </Item>;
};

// eslint-disable-next-line react/display-name
const OptionsMenu = forwardRef(({ children, ...rest }, ref) => {
  return <Dropdown className={styles.kebabMenu} {...rest}>
    <Toggle as='button' data-testid="optionsMenu-kebab-button" >
      <KebabMenuIcon />
    </Toggle>
    <Menu ref={ref} className={styles.menuDropdown}>
      {children}
    </Menu>
  </ Dropdown>;
});

export default OptionsMenu;
