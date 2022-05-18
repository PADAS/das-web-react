import React, { lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import getYear from 'date-fns/get_year';
import PropTypes from 'prop-types';

import { addModal } from '../ducks/modals';
import {
  ALERTS_CATEGORY,
  MAIN_TOOLBAR_CATEGORY,
  REPORT_EXPORT_CATEGORY,
  TABLEAU_ANALYSIS_CATEGORY,
  trackEvent,
  trackEventFactory,
} from '../utils/analytics';
import { calcEventFilterForRequest } from '../utils/event-filter';
import {
  BREAKPOINTS,
  CLIENT_BUILD_VERSION,
  DEVELOPMENT_FEATURE_FLAGS,
  FEATURE_FLAGS,
  PERMISSION_KEYS,
  PERMISSIONS,
  TAB_KEYS,
} from '../constants';
import { fetchTableauDashboard } from '../ducks/external-reporting';
import { hideDrawer } from '../ducks/drawer';
import { useFeatureFlag, useMatchMedia, usePermissions } from '../hooks';
import useNavigate from '../hooks/useNavigate';

import EarthRangerLogo from '../EarthRangerLogo';

import { ReactComponent as CrossIcon } from '../common/images/icons/cross.svg';
import { ReactComponent as DocumentIcon } from '../common/images/icons/document.svg';
import { ReactComponent as LayersIcon } from '../common/images/icons/layers.svg';
import { ReactComponent as PatrolIcon } from '../common/images/icons/patrol.svg';

import { JIRA_WIDGET_IFRAME_SELECTOR, JIRA_IFRAME_HELP_BUTTON_SELECTOR, selectSupportFormFieldByLabelText } from '../JiraSupportWidget';

import styles from './styles.module.scss';

const { ENABLE_UFA_NAVIGATION_UI } = DEVELOPMENT_FEATURE_FLAGS;

const AlertsModal = lazy(() => import('../AlertsModal'));
const DailyReportModal = lazy(() => import('../DailyReportModal'));
const DataExportModal = lazy(() => import('../DataExportModal'));
const KMLExportModal = lazy(() => import('../KMLExportModal'));

const mainToolbarTracker = trackEventFactory(MAIN_TOOLBAR_CATEGORY);
const tableuAnalysisTracker = trackEventFactory(TABLEAU_ANALYSIS_CATEGORY);

export const COMMUNITY_SITE_URL = 'https://Community.EarthRanger.com';
export const CONTACT_SUPPORT_EMAIL_ADDRESS = 'support@pamdas.org';
export const USERS_GUIDE_SITE_URL = 'https://community.earthranger.com/t/earthranger-users-guide/60';

const GlobalMenuDrawer = ({
  addModal,
  alertsEnabled,
  eventFilter,
  eventTypes,
  fetchTableauDashboard,
  hideDrawer,
  serverData,
  tableauEnabled,
  token,
  selectedUserProfile,
  user,
}) => {
  const dailyReportEnabled = useFeatureFlag(FEATURE_FLAGS.DAILY_REPORT);
  const kmlExportEnabled = useFeatureFlag(FEATURE_FLAGS.KML_EXPORT);
  const patrolFlagEnabled = useFeatureFlag(FEATURE_FLAGS.PATROL_MANAGEMENT);

  const isMediumLayoutOrLarger = useMatchMedia(BREAKPOINTS.screenIsMediumLayoutOrLarger);

  const hasPatrolViewPermissions = usePermissions(PERMISSION_KEYS.PATROLS, PERMISSIONS.READ);

  const navigate = useNavigate();

  const [modals, setModals] = useState([]);

  const showPatrols = useMemo(
    () => !!patrolFlagEnabled && !!hasPatrolViewPermissions,
    [hasPatrolViewPermissions, patrolFlagEnabled]
  );

  useEffect(() => {
    setModals([
      ...(dailyReportEnabled ? [{
        title: 'Daily Report',
        content: DailyReportModal,
        modalProps: { className: 'daily-report-modal' },
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
        modalProps: { className: 'kml-export-modal' },
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
  }, [dailyReportEnabled, eventFilter, eventTypes,  kmlExportEnabled]);

  const onModalClick = useCallback((modal, analyticsTitle = REPORT_EXPORT_CATEGORY) => {
    trackEvent(analyticsTitle, `Click '${modal.title}' menu item`);

    addModal({ ...modal });
  }, [addModal]);

  const openTableauReport = () => {
    tableuAnalysisTracker.track('Click Analysis (via Tableau) menu item');

    fetchTableauDashboard()
      .then(({ display_url }) => {
        const newWindow = window.open(display_url, '_blank', 'noopener,noreferrer');
        if (newWindow) newWindow.opener = null;
      });
  };

  const onContactSupportClick = () => {
    mainToolbarTracker.track('Click \'Contact Support\'');

    const supportiFrame = window.document.querySelector(JIRA_WIDGET_IFRAME_SELECTOR);
    const supportHelpButton = supportiFrame?.contentDocument?.querySelector(JIRA_IFRAME_HELP_BUTTON_SELECTOR);
    if (supportHelpButton) {
      supportHelpButton.click();

      const siteInput = selectSupportFormFieldByLabelText('ER Site');
      if (siteInput) {
        siteInput.value = window.location.hostname;
      }
      const username = (selectedUserProfile?.id ? selectedUserProfile: user)?.username;
      const userInput = selectSupportFormFieldByLabelText('ER Requestor Name');

      if (userInput) {
        userInput.value = username;
      }

    } else {
      window.open(
        `mailto:${CONTACT_SUPPORT_EMAIL_ADDRESS}?subject=Support request from user&body=How can we help you?`,
        '_self'
      );
    }

  };

  const onCommunityClick = () => {
    mainToolbarTracker.track('Click \'Community\' menu item');

    const newWindow = window.open(COMMUNITY_SITE_URL, '_blank', 'noopener,noreferrer');
    if (newWindow) newWindow.opener = null;
  };

  const onUsersGuideClick = () => {
    mainToolbarTracker.track('Click \'Users Guide\' menu item');

    const newWindow = window.open(USERS_GUIDE_SITE_URL, '_blank', 'noopener,noreferrer');
    if (newWindow) newWindow.opener = null;
  };

  const onOpenAlertsModalClick = useCallback(() => {
    const alertModal = {
      title: 'Alerts',
      content: AlertsModal,
      modalProps: { className: 'alerts-modal' },
    };

    document.cookie = `token=${token.access_token};path=/`;

    onModalClick(alertModal, ALERTS_CATEGORY);
  }, [onModalClick, token.access_token]);

  const onNavigationItemClick = useCallback((navigationItem) => () => {
    hideDrawer();

    navigate(`/${navigationItem.sidebarTab}`);
  }, [hideDrawer, navigate]);

  const onClose = useCallback(() => hideDrawer(), [hideDrawer]);

  const navigationItems = useMemo(() => [
    { icon: <DocumentIcon />, sidebarTab: TAB_KEYS.REPORTS, title: 'Reports' },
    ...(showPatrols ? [{ icon: <PatrolIcon />, sidebarTab: TAB_KEYS.PATROLS, title: 'Patrols' }] : []),
    { icon: <LayersIcon />, sidebarTab: TAB_KEYS.LAYERS, title: 'Map Layers' },
  ], [showPatrols]);

  return <div className={styles.globalMenuDrawer} data-testid="globalMenuDrawer">
    <div className={styles.header}>
      <EarthRangerLogo className={styles.logo} />

      <button onClick={onClose}>
        <CrossIcon />
      </button>
    </div>

    {ENABLE_UFA_NAVIGATION_UI && !isMediumLayoutOrLarger && <div className={styles.navigation}>
      {navigationItems.map((navigationItem) => <button
        key={navigationItem.title}
        onClick={onNavigationItemClick(navigationItem)}
      >
        {navigationItem.icon}
        <span>{navigationItem.title}</span>
      </button>)}
    </div>}

    <div className={styles.content}>
      <div className={styles.section}>
        {!!tableauEnabled && <button onClick={() => openTableauReport()}>Tableau</button>}
        {!!alertsEnabled && !!eventTypes.length && <button onClick={onOpenAlertsModalClick}>Alerts</button>}
        <button onClick={onContactSupportClick}>Contact Support</button>
        <button onClick={onCommunityClick}>Community</button>
        <button onClick={onUsersGuideClick}>User&apos;s Guide</button>
      </div>

      <div className={styles.section}>
        <h6>EXPORTS</h6>
        {modals.map((modal) => <button key={modal.title} onClick={() => onModalClick(modal)}>{modal.title}</button>)}
      </div>
    </div>

    <div className={styles.footer}>
      <p>
        Server version: {serverData.version}
        <br />
        Web client version: {CLIENT_BUILD_VERSION}
        <br />
        &copy;{getYear(new Date())} EarthRanger
      </p>
    </div>
  </div>;
};

GlobalMenuDrawer.propTypes = {
  addModal: PropTypes.func.isRequired,
  alertsEnabled: PropTypes.bool.isRequired,
  eventFilter: PropTypes.object.isRequired,
  eventTypes: PropTypes.array.isRequired,
  fetchTableauDashboard: PropTypes.func.isRequired,
  hideDrawer: PropTypes.func.isRequired,
  serverData: PropTypes.shape({ version: PropTypes.string }).isRequired,
  tableauEnabled: PropTypes.bool.isRequired,
  token: PropTypes.shape({ access_token: PropTypes.string }).isRequired,
};

const mapStateToProps = ({ data: { eventFilter, eventTypes, selectedUserProfile, systemStatus, token, user }, view: { systemConfig } }) => ({
  alertsEnabled: systemConfig.alerts_enabled,
  eventFilter,
  eventTypes,
  selectedUserProfile,
  serverData: systemStatus.server,
  tableauEnabled: systemConfig.tableau_enabled,
  token,
  user,
});

export default connect(
  mapStateToProps,
  { addModal, fetchTableauDashboard, hideDrawer }
)(GlobalMenuDrawer);
