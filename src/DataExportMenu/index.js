import React, { useCallback, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import Dropdown from 'react-bootstrap/Dropdown';
import { withRouter } from 'react-router-dom';

import { FEATURE_FLAGS } from '../constants';



import { addModal } from '../ducks/modals';
import DailyReportModal from '../DailyReportModal';
import HamburgerMenuIcon from '../HamburgerMenuIcon';
import DataExportModal from '../DataExportModal';
import AlertsModal from '../AlertsModal';
import AboutModal from '../AboutModal';
import KMLExportModal from '../KMLExportModal';
import { trackEvent } from '../utils/analytics';
import { useFeatureFlag } from '../hooks';
import { calcEventFilterForRequest } from '../utils/events';
import { updateUserPreferences } from '../ducks/user-preferences';
import { addUserNotification } from '../ducks/user-notifications';
import { fetchTableauDashboard } from '../ducks/external-reporting';

const { Toggle, Menu, Item, Header, Divider } = Dropdown;

const mailTo = (email, subject, message) => window.open(`mailto:${email}?subject=${subject}&body=${message}`, '_self');

const DataExportMenu = (props) => {

  const { addModal, addUserNotification, systemConfig: { zendeskEnabled, alerts_enabled, tableau_enabled }, 
    eventTypes, eventFilter, history, location, shownTableauNotification, updateUserPreferences, 
    staticContext:_staticContext, fetchTableauDashboard, token, ...rest } = props;

  console.log({ token });

  const [isOpen, setOpenState] = useState(false);

  const [modals, setModals] = useState([]);

  const dailyReportEnabled = useFeatureFlag(FEATURE_FLAGS.DAILY_REPORT);
  const kmlExportEnabled = useFeatureFlag(FEATURE_FLAGS.KML_EXPORT);

  useEffect(() => {
    setModals([
      ...(dailyReportEnabled ? [{
        title: 'Daily Report',
        content: DailyReportModal,
        modalProps: {
          className: 'daily-report-modal',
        },
      }] : []),
      {
        title: 'Field Reports',
        content: DataExportModal,
        url: 'activity/events/export',
        paramString: calcEventFilterForRequest(),
        children: <div>Exported reports will only include those matching the filter criteria currently set in the Reports tab.</div>
      },
      ...(kmlExportEnabled ? [{
        title: 'Master KML',
        content: KMLExportModal,
        url: 'subjects/kml/root',
        modalProps: {
          className: 'kml-export-modal',
        },
      }] : []),
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
    ]);
  }, [props.systemConfig, eventTypes, eventFilter, dailyReportEnabled, kmlExportEnabled]);

  const alertModal = {
    title: 'Alerts',
    content: AlertsModal,
    modalProps: {
      className: 'alerts-modal',
    },
  };

  const onDropdownToggle = (isOpen) => {
    setOpenState(isOpen);
    trackEvent('Main Toolbar', `${isOpen?'Open':'Close'} Data Export Menu`);
  };

  const onModalClick = useCallback((modal, analyticsTitle = 'Report Export') => {
    addModal({...modal});
    trackEvent(analyticsTitle, `Click '${modal.title}' menu item`);
  });

  const openTableauReport = (analyticsTitle) => {
    fetchTableauDashboard()
      .then( ({ display_url }) => {
        const newWindow = window.open(display_url, '_blank', 'noopener,noreferrer');
        if (newWindow) newWindow.opener = null;
        trackEvent(analyticsTitle, 'Click Analysis (via Tableau) menu item');    
      }); 
  };

  const onContactSupportClick = () => {
    trackEvent('Main Toolbar', 'Click \'Contact Support\'');
    if (zendeskEnabled) return window.zE.activate({ hideOnClose: true });
    return mailTo('support@pamdas.org', 'Support request from user', 'How can we help you?');
  };

  const onCommunityClick = () => {
    const newWindow = window.open('https://Community.EarthRanger.com', '_blank', 'noopener,noreferrer');
    if (newWindow) newWindow.opener = null;
    trackEvent('Main Toolbar', 'Click \'Community\' menu item');
  };

  const onDocumentationClick = () => {
    const newWindow = window.open('https://community.earthranger.com/t/earthranger-users-guide/60', '_blank', 'noopener,noreferrer');
    if (newWindow) newWindow.opener = null;
    trackEvent('Main Toolbar', 'Click \'Documentation\' menu item');
  };


  const onAboutClick = useCallback(() => {
    addModal({ content: AboutModal });
  }, [addModal]);

  const onOpenAlertsModalClick = useCallback(() => {
    document.cookie = `token=${token.access_token};path=/`;
    onModalClick(alertModal, 'Alerts');
  }, [alertModal, onModalClick, token.access_token]);

  const hamburgerToggle = useRef();

  return <Dropdown alignRight onToggle={onDropdownToggle} {...rest}>
    <Toggle as="div" ref={hamburgerToggle}>
      <HamburgerMenuIcon isOpen={isOpen} />
    </Toggle>
    <Menu>
      {!!tableau_enabled && <Item onClick={() => openTableauReport('Analysis (via Tableau)')}>Analysis (via Tableau)</Item>}
      {!!alerts_enabled && !!eventTypes.length && <Item onClick={onOpenAlertsModalClick}>Alerts</Item>}
      <Header>Exports</Header>
      {modals.map((modal, index) =>
        <Item key={index} onClick={() => onModalClick(modal)}>
          <span>{modal.title}</span> 
        </Item>
      )}
      <Divider />
      <Item onClick={onContactSupportClick}>Contact Support</Item>
      <Item onClick={onCommunityClick}>Community</Item>
      <Item onClick={onDocumentationClick}>Documentation</Item>
      <Divider />
      <Item onClick={onAboutClick}>About EarthRanger</Item>
    </Menu>
  </Dropdown>;
};

const mapStateToProps = ({ view: { systemConfig, userPreferences: { shownTableauNotification } }, data: { eventFilter, eventTypes, token } }) => ({ systemConfig, eventFilter, eventTypes, token, shownTableauNotification });
export default connect(mapStateToProps, { addModal, addUserNotification, updateUserPreferences, fetchTableauDashboard })(withRouter(DataExportMenu));
