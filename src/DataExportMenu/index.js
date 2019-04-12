import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Dropdown } from 'react-bootstrap';

import { API_URL } from '../constants';
import { downloadFileFromUrl } from '../utils/download';
import { showModal } from '../ducks/modals';
import DailyReportModal from '../DailyReportModal';
import FieldReportModal from '../FieldReportModal';
import MasterKmlModal from '../MasterKmlModal';
import SubjectInfoModal from '../SubjectInfoModal';
import SubjectReportsModal from '../SubjectReportsModal';
import HamburgerMenuIcon from '../HamburgerMenuIcon';


const { Toggle, Menu, Item, Header, Divider } = Dropdown;

const modals = [
  {
    title: 'Daily Report',
    modal: DailyReportModal,
  },
  {
    title: 'Field Reports',
    modal: FieldReportModal,
  },
  {
    title: 'Master KML',
    modal: MasterKmlModal,
  },
  {
    title: 'Subject Information',
    modal: SubjectInfoModal,
  },
  {
    title: 'Subject Reports',
    modal: SubjectReportsModal,
  },
]

const DataExportMenu = (props) => {
  const { showModal, ...rest } = props;
  const [isOpen, setOpenState] = useState(false);

  return <Dropdown onToggle={isOpen => setOpenState(isOpen)} {...rest}>
    <Toggle as="div">
      <HamburgerMenuIcon isOpen={isOpen} />
    </Toggle>
    <Menu>
      <Header>Exports</Header>
      {modals.map(({ title, modal }, index) =>
        <Item key={index} onClick={() =>
          showModal({
            content: modal,
          })}>
          <span>{title}</span>
        </Item>
      )}
      <Divider />
      <Item>Contact Support</Item>
    </Menu>
  </Dropdown>;
};

export default connect(null, { showModal })(DataExportMenu);