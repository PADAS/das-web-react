import React, { lazy, useCallback, useMemo } from 'react';
import { getYear } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CrossIcon } from '../common/images/icons/cross.svg';
import { ReactComponent as DocumentIcon } from '../common/images/icons/document.svg';
import { ReactComponent as GearIcon } from '../common/images/icons/gear.svg';
import { ReactComponent as LayersIcon } from '../common/images/icons/layers.svg';
import { ReactComponent as PatrolIcon } from '../common/images/icons/patrol.svg';

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
  PERMISSION_KEYS,
  PERMISSIONS,
  SYSTEM_CONFIG_FLAGS,
  TAB_KEYS,
} from '../constants';
import { fetchTableauDashboard } from '../ducks/external-reporting';
import { hideDrawer } from '../ducks/drawer';
import {
  JIRA_IFRAME_HELP_BUTTON_SELECTOR,
  JIRA_WIDGET_IFRAME_SELECTOR,
  selectSupportFormFieldByLabelText,
} from '../JiraSupportWidget';
import { useMatchMedia, usePermissions, useSystemConfigFlag } from '../hooks';
import useNavigate from '../hooks/useNavigate';

import EarthRangerLogo from '../EarthRangerLogo';

import styles from './styles.module.scss';

const AlertsModal = lazy(() => import('../AlertsModal'));
const DailyReportModal = lazy(() => import('../DailyReportModal'));
const DataExportModal = lazy(() => import('../DataExportModal'));
const KMLExportModal = lazy(() => import('../KMLExportModal'));

const mainToolbarTracker = trackEventFactory(MAIN_TOOLBAR_CATEGORY);
const tableuAnalysisTracker = trackEventFactory(TABLEAU_ANALYSIS_CATEGORY);

export const COMMUNITY_SITE_URL = 'https://Community.EarthRanger.com';
export const CONTACT_SUPPORT_EMAIL_ADDRESS = 'support@pamdas.org';
export const DATA_PRIVACY_POLICY_URL = 'https://assets-global.website-files.com/61a93c4da07e4e6975c3f2b2/61eaeb2ccd0b65595bd4d387_EarthRanger_PP_ver2021-10-01.pdf';
export const EULA_URL = 'https://assets.website-files.com/61a93c4da07e4e6975c3f2b2/61d7274b9ba24a5d8bac44b2_EarthRanger_EULA_ver2021-10-01.pdf';
export const HELP_CENTER_SITE_URL = 'https://support.earthranger.com/';
export const USERS_GUIDE_SITE_URL = 'https://community.earthranger.com/t/earthranger-users-guide/60';
export const WEBSITE_PRIVACY_POLICY_URL = 'https://www.earthranger.com/privacy-policy';

const GlobalMenuDrawer = () => {
  const dailyReportEnabled = useSystemConfigFlag(SYSTEM_CONFIG_FLAGS.DAILY_REPORT);
  const kmlExportEnabled = useSystemConfigFlag(SYSTEM_CONFIG_FLAGS.KML_EXPORT);
  const patrolFlagEnabled = useSystemConfigFlag(SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation('menu-drawer', { keyPrefix: 'globalMenuDrawer' });

  const hasPatrolViewPermissions = usePermissions(PERMISSION_KEYS.PATROLS, PERMISSIONS.READ);
  const hasObservationExportPermissions = usePermissions(PERMISSION_KEYS.OBSERVATIONS_EXPORT, PERMISSIONS.READ);
  const hasEventExportPermissions = usePermissions(PERMISSION_KEYS.EVENTS_EXPORT, PERMISSIONS.READ);

  const isMediumLayoutOrLarger = useMatchMedia(BREAKPOINTS.screenIsMediumLayoutOrLarger);

  const alertsEnabled = useSelector((state) => state.view.systemConfig.alerts_enabled);
  const eventFilter = useSelector((state) => state.data.eventFilter);
  const eventTypes = useSelector((state) => state.data.eventTypes);
  const selectedUserProfile = useSelector((state) => state.data.selectedUserProfile);
  const serverData = useSelector((state) => state.data.systemStatus.server);
  const tableauEnabled = useSelector((state) => state.view.systemConfig.tableau_enabled);
  const token = useSelector((state) => state.data.token);
  const user = useSelector((state) => state.data.user);

  const modals = useMemo(() => {
    const modals = [
    ];

    if (dailyReportEnabled) {
      modals.push(
        {
          title: t('dailyReportModal.title'),
          content: DailyReportModal,
          modalProps: { className: 'daily-report-modal' },
        }
      );
    }

    if (kmlExportEnabled) {
      modals.push(
        {
          title: t('masterKMLModal.title'),
          content: KMLExportModal,
          url: 'subjects/kml/root',
          modalProps: { className: 'kml-export-modal' },
        }
      );
    }

    if (hasObservationExportPermissions) {
      modals.push(...[
        {
          title: t('subjectInformationModal.title'),
          content: DataExportModal,
          url: 'trackingmetadata/export',
        },
        {
          title: t('subjectReportsModal.title'),
          content: DataExportModal,
          url: 'trackingdata/export',
        }
      ]);
    }

    if (hasEventExportPermissions) {
      modals.push(
        {
          title: t('fieldReportsModal.title'),
          content: DataExportModal,
          url: 'activity/events/export',
          paramString: calcEventFilterForRequest(),
          children: <div>{t('fieldReportsModal.content')}</div>
        }
      );
    }

    return modals;
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [eventFilter, hasEventExportPermissions, hasObservationExportPermissions, dailyReportEnabled, kmlExportEnabled, t]);

  const showPatrols = !!patrolFlagEnabled && !!hasPatrolViewPermissions;

  const onModalClick = useCallback((modal, analyticsTitle = REPORT_EXPORT_CATEGORY) => {
    trackEvent(analyticsTitle, `Click '${modal.title}' menu item`);

    dispatch(addModal({ ...modal }));
  }, [dispatch]);

  const openTableauReport = () => {
    tableuAnalysisTracker.track('Click Analysis (via Tableau) menu item');

    dispatch(fetchTableauDashboard())
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
      const username = (selectedUserProfile?.id ? selectedUserProfile : user)?.username;
      const userInput = selectSupportFormFieldByLabelText('ER Requestor Name');

      if (userInput) {
        userInput.value = username;
      }
    } else {
      window.open(
        `mailto:${CONTACT_SUPPORT_EMAIL_ADDRESS}?subject=${t('contactSupport.subject')}&body=${t('contactSupport.body')}`,
        '_self'
      );
    }
  };

  const onHelpCenterClick = () => {
    mainToolbarTracker.track('Click \'Help Center\' menu item');

    const newWindow = window.open(HELP_CENTER_SITE_URL, '_blank', 'noopener,noreferrer');
    if (newWindow) {
      newWindow.opener = null;
    }
  };

  const onCommunityClick = () => {
    mainToolbarTracker.track('Click \'Community\' menu item');

    const newWindow = window.open(COMMUNITY_SITE_URL, '_blank', 'noopener,noreferrer');
    if (newWindow) {
      newWindow.opener = null;
    }
  };

  const onUsersGuideClick = () => {
    mainToolbarTracker.track('Click \'Users Guide\' menu item');

    const newWindow = window.open(USERS_GUIDE_SITE_URL, '_blank', 'noopener,noreferrer');
    if (newWindow) {
      newWindow.opener = null;
    }
  };

  const onOpenAlertsModalClick = useCallback(() => {
    document.cookie = `token=${token.access_token};path=/`;

    onModalClick({
      title: t('alertsModal.title'),
      content: AlertsModal,
      modalProps: { className: 'alerts-modal' },
    }, ALERTS_CATEGORY);
  }, [onModalClick, t, token.access_token]);

  const onNavigationItemClick = useCallback((navigationItem) => () => {
    dispatch(hideDrawer());

    navigate(`/${navigationItem.sidebarTab}`);
  }, [dispatch, navigate]);

  const onClose = useCallback(() => dispatch(hideDrawer()), [dispatch]);

  const navigationItems = useMemo(() => [
    { icon: <DocumentIcon />, sidebarTab: TAB_KEYS.EVENTS, title: t('navigationButton.reports') },
    ...(showPatrols
      ? [{ icon: <PatrolIcon />, sidebarTab: TAB_KEYS.PATROLS, title: t('navigationButton.patrols') }]
      : []),
    { icon: <LayersIcon />, sidebarTab: TAB_KEYS.LAYERS, title: t('navigationButton.mapLayers') },
    { icon: <GearIcon />, sidebarTab: TAB_KEYS.SETTINGS, title: t('navigationButton.settings') },
  ], [showPatrols, t]);

  return <div className={styles.globalMenuDrawer} data-testid="globalMenuDrawer">
    <div className={styles.header}>
      <EarthRangerLogo className={styles.logo} />

      <button aria-label={t('closeButtonLabel')} onClick={onClose} title={t('closeButtonTitle')}>
        <CrossIcon />
      </button>
    </div>

    {!isMediumLayoutOrLarger && <div className={styles.navigation}>
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
        {!!tableauEnabled && <button onClick={() => openTableauReport()}>{t('tableauButton')}</button>}
        {!!alertsEnabled && !!eventTypes.length && <button onClick={onOpenAlertsModalClick}>{t('alertsButton')}</button>}
        <button onClick={onContactSupportClick}>{t('contactSupportButton')}</button>
        <button onClick={onHelpCenterClick}>{t('helpCenterButton')}</button>
        <button onClick={onCommunityClick}>{t('communityButton')}</button>
        <button onClick={onUsersGuideClick}>{t('usersGuideButton')}</button>
      </div>

      <div className={styles.section}>
        <h6>{t('exportsHeader')}</h6>

        {modals.map((modal) => <button key={modal.title} onClick={() => onModalClick(modal)}>{modal.title}</button>)}
      </div>
    </div>

    <div className={styles.footer}>
      <p className={styles.releaseVersions}>
        {t('footer.serverVersion', { version: serverData.version })}
        <br />
        {t('footer.clientVersion', { version: CLIENT_BUILD_VERSION })}
        <br />
        {t('footer.copyright', { year: getYear(new Date()) })}
      </p>

      <ul className={styles.policies}>
        <li>
          <a data-testid="eula-link" href={EULA_URL} rel="noreferrer" target="_blank">{t('footer.eulaLink')}</a>
        </li>

        <li>
          <a
            data-testid="website-privacy-policy"
            href={WEBSITE_PRIVACY_POLICY_URL}
            rel="noreferrer"
            target="_blank"
          >
            {t('footer.websitePrivacyPolicyLink')}
          </a>
        </li>

        <li>
          <a
            data-testid="data-privacy-policy"
            href={DATA_PRIVACY_POLICY_URL}
            rel="noreferrer"
            target="_blank"
          >
            {t('footer.dataPrivacyPolicyLink')}
          </a>
        </li>
      </ul>
    </div>
  </div>;
};

export default GlobalMenuDrawer;
