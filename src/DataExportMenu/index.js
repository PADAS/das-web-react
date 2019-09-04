import React, { useState } from 'react';
import { connect } from 'react-redux';
import Dropdown from 'react-bootstrap/Dropdown';

import { addModal } from '../ducks/modals';
import DailyReportModal from '../DailyReportModal';
import HamburgerMenuIcon from '../HamburgerMenuIcon';
import DataExportModal from '../DataExportModal';
import { trackEvent } from '../utils/analytics';

const { Toggle, Menu, Item, Header, Divider } = Dropdown;

const modals = [
  {
    title: 'Daily Report',
    content: DailyReportModal,
  },
  {
    title: 'Field Reports',
    content: DataExportModal,
    url: 'activity/events/export',
  },
  {
    title: 'Master KML',
    content: DataExportModal,
    url: 'subjects/kml/root',
  },
  {
    title: 'Subject Information',
    content: DataExportModal,
    url: 'trackingmetadata/export',
  },
  {
    title: 'Subject Reports',
    content: DataExportModal,
    url: 'trackingdata/export',
  },
];

const mailTo = (email, subject, message) => window.open(`mailto:${email}?subject=${subject}&body=${message}`, '_self');

const DataExportMenu = (props) => {
  const { addModal, zendeskEnabled, ...rest } = props;
  const [isOpen, setOpenState] = useState(false);

  const onDropdownToggle = (isOpen) => {
    setOpenState(isOpen);
    trackEvent('Main Toolbar', `${isOpen?'Open':'Close'} Data Export Menu`);
  };

  const onModalClick = (modal) => {
    addModal({...modal,});
    trackEvent('Report Export', `Click '${modal.title}' menu item`);
  };

  const onContactSupportClick = () => {
    trackEvent('Main Toolbar', "Click 'Contact Support'");
    if (zendeskEnabled) return window.zE.activate({ hideOnClose: true });
    return mailTo('support@pamdas.org', 'Support request from user', 'How can we help you?');
  };

  return <Dropdown alignRight onToggle={onDropdownToggle} {...rest}>
    <Toggle as="div">
      <HamburgerMenuIcon isOpen={isOpen} />
    </Toggle>
    <Menu>
      <Header>Exports</Header>
      {modals.map((modal, index) =>
        <Item key={index} onClick={() => onModalClick(modal)}>
          <span>{modal.title}</span>
        </Item>
      )}
      <Divider />
      <Header>Support</Header>
      <Item onClick={onContactSupportClick}>Contact Support</Item>
    </Menu>
  </Dropdown>;
};

const mapStateToProps = ({ view: { zendeskEnabled } }) => ({ zendeskEnabled });

export default connect(mapStateToProps, { addModal })(DataExportMenu);