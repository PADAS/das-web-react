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
import TableauModal from '../TableauModal';
import { trackEvent } from '../utils/analytics';
import { evaluateFeatureFlag } from '../utils/feature-flags';
import { calcEventFilterForRequest } from '../utils/events';
import { fetchCurrentUser } from '../ducks/user';
import { updateUserPreferences } from '../ducks/user-preferences';
import { addUserNotification, removeUserNotification } from '../ducks/user-notifications';

const { Toggle, Menu, Item, Header, Divider } = Dropdown;

const mailTo = (email, subject, message) => window.open(`mailto:${email}?subject=${subject}&body=${message}`, '_self');

const DataExportMenu = (props) => {
  const { addModal, addUserNotification, removeUserNotification, systemConfig: { zendeskEnabled, alerts_enabled }, eventTypes, eventFilter, fetchCurrentUser, history, location, shownTableauNotification, user, updateUserPreferences, ...rest } = props;
  const [hasTableauNotification, setHasTableauNotification] = useState(shownTableauNotification);
  const [isOpen, setOpenState] = useState(false);

  const [modals, setModals] = useState([]);

  useEffect(() => {
    setModals([
      ...(evaluateFeatureFlag(FEATURE_FLAGS.DAILY_REPORT)? [{
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
      },
      ...(evaluateFeatureFlag(FEATURE_FLAGS.KML_EXPORT) ? [{
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
      ...(evaluateFeatureFlag(FEATURE_FLAGS.TABLEAU) ? [{
        title: 'Analysis (via Tableau)',
        content: TableauModal,
        url: 'tableau',
        modalProps: {
          className: 'tableau-modal',
        },
      }] : []),
    ]);
  }, [props.systemConfig, eventTypes, eventFilter]);

  useEffect(() => {
    if (evaluateFeatureFlag(FEATURE_FLAGS.TABLEAU) && !hasTableauNotification) {
      addUserNotification({
        message: 'Check out your new analysis dashboard, available in the main menu at the top right of your screen, generously provided by Tableau.',
        onConfirm(_e, item) {
          hamburgerToggle.current.click();
          setHasTableauNotification(false);
          removeUserNotification(item.id);
          updateUserPreferences({
            shownTableauNotification: true
          });
        },
        onDismiss(_e, item) {
          setHasTableauNotification(false);
          removeUserNotification(item.id);
          updateUserPreferences({
            shownTableauNotification: true
          });
        },
        confirmText: 'OK',
      });

      setHasTableauNotification(true);
    }
  }, [props.systemConfig]);

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

  const onModalClick = (modal, analyticsTitle = 'Report Export') => {
    addModal({...modal});
    trackEvent(analyticsTitle, `Click '${modal.title}' menu item`);
  };

  const onContactSupportClick = () => {
    trackEvent('Main Toolbar', 'Click \'Contact Support\'');
    if (zendeskEnabled) return window.zE.activate({ hideOnClose: true });
    return mailTo('support@pamdas.org', 'Support request from user', 'How can we help you?');
  };

  const onAboutClick = useCallback(() => {
    addModal({ content: AboutModal });
  }, [addModal]);

  const hamburgerToggle = useRef();

  return <Dropdown alignRight onToggle={onDropdownToggle} {...rest}>
    <Toggle as="div" ref={hamburgerToggle}>
      <HamburgerMenuIcon isOpen={isOpen} />
    </Toggle>
    <Menu>
      {!!alerts_enabled && <Item onClick={() => onModalClick(alertModal, 'Alerts')}>Alerts </Item>}
      <Header>Exports</Header>
      {modals.map((modal, index) =>
        <Item key={index} onClick={() => onModalClick(modal)}>
          <span>{modal.title}</span>
        </Item>
      )}
      <Divider />
      <Header>Support</Header>
      <Item onClick={onContactSupportClick}>Contact Support</Item>
      <Divider />
      <Item onClick={onAboutClick}>About EarthRanger</Item>
    </Menu>
  </Dropdown>;
};

const mapStateToProps = ({ view: { systemConfig, userPreferences: { shownTableauNotification } }, data: { eventFilter, eventTypes, user } }) => ({ systemConfig, eventFilter, eventTypes, shownTableauNotification, user });

export default connect(mapStateToProps, { addModal, addUserNotification, fetchCurrentUser, removeUserNotification, updateUserPreferences })(withRouter(DataExportMenu));
