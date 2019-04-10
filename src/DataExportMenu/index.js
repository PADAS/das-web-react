import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Dropdown } from 'react-bootstrap';

import HamburgerMenuIcon from '../HamburgerMenuIcon';

const { Toggle, Menu, Item } = Dropdown;

export default (props) => {
  const { ...rest } = props;
  const [isOpen, setOpenState] = useState(false)

  return <Dropdown onToggle={isOpen => setOpenState(isOpen)} {...rest}>
    <Toggle as="div">
      <HamburgerMenuIcon isOpen={isOpen} />
    </Toggle>
    <Menu>
      <Item>A great menu item indeed</Item>
    </Menu>
  </Dropdown>;
};