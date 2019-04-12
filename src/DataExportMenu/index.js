import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Dropdown } from 'react-bootstrap';

import { API_URL } from '../constants';
import { downloadFileFromUrl } from '../utils/download';
import { showModal } from '../ducks/modals';
import DailyReportModal from '../DailyReportModal';
import HamburgerMenuIcon from '../HamburgerMenuIcon';


const { Toggle, Menu, Item } = Dropdown;

const DataExportMenu = (props) => {
  const { showModal, ...rest } = props;
  const [isOpen, setOpenState] = useState(false);

  return <Dropdown onToggle={isOpen => setOpenState(isOpen)} {...rest}>
    <Toggle as="div">
      <HamburgerMenuIcon isOpen={isOpen} />
    </Toggle>
    <Menu>
      <Item onClick={() =>
        showModal({
          content: DailyReportModal,
        })}>
        <span>Daily Report</span>
      </Item>
    </Menu>
  </Dropdown>;
};

export default connect(null, { showModal })(DataExportMenu);