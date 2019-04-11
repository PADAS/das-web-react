import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Dropdown } from 'react-bootstrap';

import { API_URL } from '../constants';
import { downloadFileFromUrl } from '../utils/download';
import HamburgerMenuIcon from '../HamburgerMenuIcon';

const { Toggle, Menu, Item } = Dropdown;

const DataExportMenu = (props) => {
  const { ...rest } = props;
  const [isOpen, setOpenState] = useState(false);

  return <Dropdown onToggle={isOpen => setOpenState(isOpen)} {...rest}>
    <Toggle as="div">
      <HamburgerMenuIcon isOpen={isOpen} />
    </Toggle>
    <Menu>
      <Item>A great menu item indeed</Item>
      <Item onClick={() => downloadFileFromUrl(`${API_URL}reports/sitrep.docx?before=2019-04-12T01:00:00.000Z&since=2019-04-11T01:00:00.000Z`)}>OK</Item>
    </Menu>
  </Dropdown>;
};

export default DataExportMenu;