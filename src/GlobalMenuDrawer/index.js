import React, { lazy, useCallback, useEffect, useMemo, useRef } from 'react';
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
import { BREAKPOINTS, CLIENT_BUILD_VERSION, SYSTEM_CONFIG_FLAGS, TAB_KEYS } from '../constants';
import { calcEventFilterForRequest } from '../utils/event-filter';
import { fetchTableauDashboard } from '../ducks/external-reporting';
import { hideDrawer } from '../ducks/drawer';
import { getAlertsEnabled } from '../selectors';
import {
  JIRA_IFRAME_HELP_BUTTON_SELECTOR,
  JIRA_WIDGET_IFRAME_SELECTOR,
  selectSupportFormFieldByLabelText,
} from '../JiraSupportWidget';
import { useObservationsPermissions, usePatrolsPermissions } from '../hooks/usePermissions';
import { useMatchMedia } from '../hooks';

import EarthRangerLogo from '../EarthRangerLogo';
import Link from '../Link';

import * as styles from './styles.module.scss';

const AlertsModal = lazy(() => import('../AlertsModal'));
const DailyReportModal = lazy(() => import('../DailyReportModal'));
const DataExportModal = lazy(() => import('../DataExportModal'));
const KMLExportModal = lazy(() => import('../KMLExportModal'));

const mainToolbarTracker = trackEventFactory(MAIN_TOOLBAR_CATEGORY);
const tableuAnalysisTracker = trackEventFactory(TABLEAU_ANALYSIS_CATEGORY);

export const COMMUNITY_SITE_URL = 'https://Community.EarthRanger.com';
export const CONTACT_SUPPORT_EMAIL_ADDRESS = 'support@pamdas.org';
export const DATA_PRIVACY_POLICY_URL = 'https://assets-global.website-files.com/61a93c4da07e4e6975c3f2b2/61eaeb2ccd0b65595bd4d387_EarthRanger_PP_ver2021-10-01.pdf';
export const ECOSCOPE_ANALYSIS_URL = 'https://app.ecoscope.io/login';
export const ECOSCOPE_DOWNLOADER_MIGRATION_GUIDE_URL = 'https://support.earthranger.com/en_US/ecoscope-getting-help/ecoscope-migration-guide';
export const EULA_URL = 'https://assets.website-files.com/61a93c4da07e4e6975c3f2b2/61d7274b9ba24a5d8bac44b2_EarthRanger_EULA_ver2021-10-01.pdf';
export const HELP_CENTER_SITE_URL = 'https://support.earthranger.com/';
export const USERS_GUIDE_SITE_URL = 'https://support.earthranger.com/en_US/earthranger-web';
export const WEBSITE_PRIVACY_POLICY_URL = 'https://www.earthranger.com/privacy-policy';

const GlobalMenuDrawer = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('menu-drawer', { keyPrefix: 'globalMenuDrawer' });

  const isMediumLayoutOrLarger = useMatchMedia(BREAKPOINTS.screenIsMediumLayoutOrLarger);

  const alertsEnabled = useSelector(getAlertsEnabled);
  const dailyReportEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.DAILY_REPORT]);
  const drawer = useSelector((state) => state.view.drawer);
  const eventsEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.EVENTS]);
  const eventFilter = useSelector((state) => state.data.eventFilter);
  const eventTypes = useSelector((state) => state.data.eventTypes);
  const kmlExportEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.KML_EXPORT]);
  const patrolManagementEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]);
  const selectedUserProfile = useSelector((state) => state.data.selectedUserProfile);
  const serverData = useSelector((state) => state.data.systemStatus.server);
  const subjectsEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.SUBJECTS]);
  const tableauEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.TABLEAU]);
  const token = useSelector((state) => state.data.token);
  const user = useSelector((state) => state.data.user);

  const { hasObservationsExportPermission } = useObservationsPermissions();
  const { hasPatrolsReadPermission } = usePatrolsPermissions();

  const closeButtonRef = useRef();
  const dataPrivacyPolicyLinkRef = useRef();

  const canReadPatrols = patrolManagementEnabled && hasPatrolsReadPermission;

  const jiraIframeHelpButton = useMemo(() => {
    const jiraWidgetIframe = document.querySelector(JIRA_WIDGET_IFRAME_SELECTOR);
    return jiraWidgetIframe?.contentDocument?.querySelector(JIRA_IFRAME_HELP_BUTTON_SELECTOR);
  }, []);

  // Calculate the export modals buttons that should be rendered based on if
  // they are enabled or not.
  const exportModals = useMemo(() => {
    const exportModals = [];

    if (dailyReportEnabled) {
      exportModals.push({
        content: DailyReportModal,
        modalProps: { className: 'daily-report-modal' },
        title: t('dailyReportModal.title'),
      });
    }

    if (kmlExportEnabled && subjectsEnabled) {
      exportModals.push({
        content: KMLExportModal,
        modalProps: { className: 'kml-export-modal' },
        title: t('masterKMLModal.title'),
        url: 'subjects/kml/root',
      });
    }

    if (hasObservationsExportPermission && subjectsEnabled) {
      exportModals.push({
        content: DataExportModal,
        title: t('subjectInformationModal.title'),
        url: 'trackingmetadata/export',
      }, {
        content: DataExportModal,
        title: t('subjectReportsModal.title'),
        url: 'trackingdata/export',
      });
    }

    if (eventsEnabled) {
      exportModals.push({
        children: <div>{t('fieldReportsModal.content')}</div>,
        content: DataExportModal,
        paramString: calcEventFilterForRequest(),
        title: t('fieldReportsModal.title'),
        url: 'activity/events/export',
      });
    }

    return exportModals;
  // calcEventFilterForRequest uses store.getState() to fetch the event filter,
  // so if eventFilter is not in the dependency array, the memoization will not
  // be invalidated when the event filter changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dailyReportEnabled,
    eventFilter,
    eventsEnabled,
    hasObservationsExportPermission,
    kmlExportEnabled,
    subjectsEnabled,
    t,
  ]);

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

    // Forward the click to the JIRA help button.
    jiraIframeHelpButton.click();

    // Prefill the site and user inputs if possible.
    const siteInput = selectSupportFormFieldByLabelText('ER Site');
    if (siteInput) {
      siteInput.value = window.location.hostname;
    }
    const userInput = selectSupportFormFieldByLabelText('ER Requestor Name');
    if (userInput) {
      userInput.value = (selectedUserProfile?.id ? selectedUserProfile : user)?.username;
    }
  };

  const onModalClick = useCallback((modal, analyticsTitle = REPORT_EXPORT_CATEGORY) => {
    trackEvent(analyticsTitle, `Click '${modal.title}' menu item`);

    dispatch(addModal({ ...modal }));
  }, [dispatch]);

  const onOpenAlertsModalClick = useCallback(() => {
    document.cookie = `token=${token.access_token};path=/`;

    onModalClick({
      content: AlertsModal,
      modalProps: { className: 'alerts-modal' },
      title: t('alertsModal.title'),
    }, ALERTS_CATEGORY);
  }, [onModalClick, t, token.access_token]);

  // Calculate the navigation links to show based on the enabled features.
  const navigationItems = useMemo(() => [
    { icon: <DocumentIcon />, sidebarTab: TAB_KEYS.EVENTS, title: t('navigationButton.reports') },
    ...(canReadPatrols
      ? [{ icon: <PatrolIcon />, sidebarTab: TAB_KEYS.PATROLS, title: t('navigationButton.patrols') }]
      : []),
    { icon: <LayersIcon />, sidebarTab: TAB_KEYS.LAYERS, title: t('navigationButton.mapLayers') },
    { icon: <GearIcon />, sidebarTab: TAB_KEYS.SETTINGS, title: t('navigationButton.settings') },
  ], [canReadPatrols, t]);

  useEffect(() => {
    if (drawer.drawerId === 'global-menu' && drawer.isOpen) {
      // Focus the close button when the global menu drawer gets opened.
      closeButtonRef.current.focus();

      // And create a focus trap so only internal elements are focused when
      // pressing tab.
      const onKeyDown = (event) => {
        if (event.key === 'Tab') {
          if (event.shiftKey && document.activeElement === closeButtonRef.current) {
            if (document.activeElement === closeButtonRef.current) {
              event.preventDefault();

              dataPrivacyPolicyLinkRef.current.focus();
            }
          } else if (!event.shiftKey && document.activeElement === dataPrivacyPolicyLinkRef.current) {
            event.preventDefault();

            closeButtonRef.current.focus();
          }
        }
      };

      document.addEventListener('keydown', onKeyDown);

      return () => document.removeEventListener('keydown', onKeyDown);
    }
  }, [drawer.drawerId, drawer.isOpen]);

  return <div
      aria-labelledby="global-menu-drawer-heading"
      aria-modal="true"
      className={styles.globalMenuDrawer}
      role="dialog"
    >
    <header className={styles.header}>
      <h2 className="sr-only" id="global-menu-drawer-heading">{t('header')}</h2>

      <EarthRangerLogo className={styles.logo} />

      <button
        aria-label={t('closeButtonLabel')}
        className={styles.closeButton}
        onClick={() => dispatch(hideDrawer())}
        ref={closeButtonRef}
        title={t('closeButtonTitle')}
        type="button"
      >
        <CrossIcon aria-hidden />
      </button>
    </header>

    {/* Only show the nav in small devices. */}
    {!isMediumLayoutOrLarger && <>
      <hr aria-hidden className={styles.separator} />

      <nav>
        <ul>
          {navigationItems.map((navigationItem) => <li key={navigationItem.title}>
            <Link onClick={() => dispatch(hideDrawer())} to={`/${navigationItem.sidebarTab}`}>
              {navigationItem.icon}

              <span>{navigationItem.title}</span>
            </Link>
          </li>)}
        </ul>
      </nav>
    </>}

    <hr aria-hidden className={styles.separator} />

    <ul>
      <li>
        {!!tableauEnabled && <button onClick={() => openTableauReport()} type="button">
          {t('tableauButton')}
        </button>}
      </li>

      <li>
        {!!alertsEnabled && !!eventTypes.length && <button onClick={onOpenAlertsModalClick} type="button">
          {t('alertsButton')}
        </button>}
      </li>

      <li>
        {jiraIframeHelpButton ? <button onClick={onContactSupportClick} type="button">
          {t('contactSupportButton')}
        </button> : <a
          href={`mailto:${CONTACT_SUPPORT_EMAIL_ADDRESS}?subject=${t('contactSupport.subject')}&body=${t('contactSupport.body')}`}
          onClick={() => mainToolbarTracker.track('Click \'Contact Support\'')}
        >
          {t('contactSupportButton')}
        </a>}
      </li>

      <li>
        <a
          href={HELP_CENTER_SITE_URL}
          onClick={() => mainToolbarTracker.track('Click \'Help Center\' menu item')}
          rel="noopener noreferrer"
          target="_blank"
        >
          {t('helpCenterButton')}
        </a>
      </li>

      <li>
        <a
          href={COMMUNITY_SITE_URL}
          onClick={() => mainToolbarTracker.track('Click \'Community\' menu item')}
          rel="noopener noreferrer"
          target="_blank"
        >
          {t('communityButton')}
        </a>
      </li>

      <li>
        <a
          href={USERS_GUIDE_SITE_URL}
          onClick={() => mainToolbarTracker.track('Click \'Users Guide\' menu item')}
          rel="noopener noreferrer"
          target="_blank"
        >
          {t('usersGuideButton')}
        </a>
      </li>
    </ul>

    <hr aria-hidden className={styles.separator} />

    <h3>{t('exportsHeader')}</h3>

    <ul>
      {exportModals.map((modal) => <li key={modal.title}>
        <button onClick={() => onModalClick(modal)} type="button">{modal.title}</button>
      </li>)}

      <li className={styles.nestedListItem}>
        <h4>{t('ecoscopeHeading')}</h4>

        <ul>
          <li>
            <a
              aria-label={t('ecoscopeDownloaderLinkAriaLabel')}
              href={ECOSCOPE_DOWNLOADER_MIGRATION_GUIDE_URL}
              onClick={() => mainToolbarTracker.track('Click \'Ecoscope Downloader\' menu item')}
              rel="noopener noreferrer"
              target="_blank"
            >
              {t('ecoscopeDownloaderLink')}
            </a>
          </li>

          <li>
            <a
              aria-label={t('ecoscopeAnalysisLinkAriaLabel')}
              href={ECOSCOPE_ANALYSIS_URL}
              onClick={() => mainToolbarTracker.track('Click \'Ecoscope Analysis\' menu item')}
              rel="noopener noreferrer"
              target="_blank"
            >
              {t('ecoscopeAnalysisLink')}
            </a>
          </li>
        </ul>
      </li>
    </ul>

    <footer className={styles.footer}>
      <p className={styles.versionsAndCopyright}>
        {t('footer.serverVersion', { version: serverData.version })}

        <br />

        {t('footer.clientVersion', { version: CLIENT_BUILD_VERSION })}

        <br />

        {t('footer.copyright', { year: getYear(new Date()) })}
      </p>

      <ul className={styles.policies}>
        <li>
          <a href={EULA_URL} rel="noreferrer" target="_blank">{t('footer.eulaLink')}</a>
        </li>

        <li>
          <a href={WEBSITE_PRIVACY_POLICY_URL} rel="noreferrer" target="_blank">
            {t('footer.websitePrivacyPolicyLink')}
          </a>
        </li>

        <li>
          <a
            href={DATA_PRIVACY_POLICY_URL}
            ref={dataPrivacyPolicyLinkRef}
            rel="noreferrer"
            target="_blank"
          >
            {t('footer.dataPrivacyPolicyLink')}
          </a>
        </li>
      </ul>
    </footer>
  </div>;
};

export default GlobalMenuDrawer;
