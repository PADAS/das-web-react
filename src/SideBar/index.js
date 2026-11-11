import { memo, useContext, useEffect, useMemo, useState } from 'react';
import { matchPath, Route, Routes, useLocation } from 'react-router';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowLeftIcon } from '../common/images/icons/arrow-left.svg';
import { ReactComponent as BulletListIcon } from '../common/images/icons/bullet-list.svg';
import { ReactComponent as CrossIcon } from '../common/images/icons/cross.svg';
import { ReactComponent as DocumentIcon } from '../common/images/icons/document.svg';
import { ReactComponent as GearIcon } from '../common/images/icons/gear.svg';
import { ReactComponent as LayersIcon } from '../common/images/icons/layers.svg';
import { ReactComponent as MarkerFeedIcon } from '../common/images/icons/marker-feed.svg';
import { ReactComponent as OtusIcon } from '../common/images/icons/otus.svg';
import { ReactComponent as PatrolIcon } from '../common/images/icons/patrol.svg';
import { ReactComponent as TableIcon } from '../common/images/icons/table.svg';

import { detailViewPattern, getCurrentIdFromURL, getCurrentTabFromURL, tabPath } from '../utils/navigation';
import { FEED_CATEGORY } from '../utils/analytics';
import { PREVIEW_FEATURES, SYSTEM_CONFIG_FLAGS, TAB_KEYS } from '../constants';
import { SocketContext } from '../withSocketConnection';
import useNavigate from '../hooks/useNavigate';
import { usePatrolsPermissions } from '../hooks/usePermissions';
import { usePreviewFeature } from '../hooks';
import useFeedTableView, { useTableViewLink } from '../FeedTable/useFeedTableView';
import useReportsFeed from './useReportsFeed';

import AddItemButton from '../AddItemButton';
import Badge from '../Badge';
import EarthRangerLogo from '../EarthRangerLogo';
import Link from '../Link';
import PatrolDetailView from '../PatrolDetailView';
import SoundNotificationsPlayer from '../SoundNotificationsPlayer';

import EventsManager from './EventsManager';
import GearTab from './GearTab';
import MapLayersTab from './MapLayersTab';
import OtusTab from './OtusTab';
import PatrolsFeed from './PatrolsFeed';
import PatrolsManager from './PatrolsManager';
import SettingsPane from './SettingsPane';

import * as styles from './styles.module.scss';

// A bit longer than the tab's slide out, in case its transitionend never fires.
const CLOSING_UNMOUNT_DELAY = 450;

const EMPTY_EVENT_IDS = new Set();

const LEGACY_EVENTS_TAB_KEY = 'reports';

const SideBar = () => {
  const location = useLocation();
  const { t } = useTranslation('components', { keyPrefix: 'sideBar' });

  const eventsFeed = useReportsFeed();
  const { hasPatrolsReadPermission } = usePatrolsPermissions();
  const navigate = useNavigate();
  const patrolSchemasEnabled = usePreviewFeature(PREVIEW_FEATURES.PATROL_SCHEMAS);

  const analyzersEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.ANALYZERS]);
  const eventsEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.EVENTS]);
  const hasGear = useSelector((state) => state.data.gear.hasGear);
  const isGearEndpointUnavailable = useSelector((state) => state.data.gear.gearEndpointUnavailable);
  const isGearInitialLoadInProgress = useSelector((state) => state.data.gear.initialLoadInProgress);
  const isGearLoading = useSelector((state) => state.data.gear.loading);
  const isSideBarShown = useSelector((state) => state.view.sideBar.showSideBar);
  const otusUrl = useSelector((state) => state.view.systemConfig.otusUrl);
  const patrolManagementEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]);
  const spatialFeaturesEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.SPATIAL_FEATURES]);
  const subjectsEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.SUBJECTS]);

  const socket = useContext(SocketContext);

  const [tabLocation, setTabLocation] = useState(null);
  const [updatedEventIds, setUpdatedEventIds] = useState(EMPTY_EVENT_IDS);

  const canReadPatrols = patrolManagementEnabled && hasPatrolsReadPermission;

  const currentTab = getCurrentTabFromURL(location.pathname);

  const isLegacyEventURL = currentTab === LEGACY_EVENTS_TAB_KEY;
  const shouldShowLayersTab = analyzersEnabled || spatialFeaturesEnabled || subjectsEnabled || eventsEnabled;

  const isEventDetailViewActive = eventsEnabled
    && !!matchPath(detailViewPattern(TAB_KEYS.EVENTS), location.pathname);

  const shouldShowOtusTab = !!otusUrl;

  const isOtusTabActive = shouldShowOtusTab && currentTab === TAB_KEYS.OTUS;

  const isGearStillResolving = !isGearEndpointUnavailable
    && (isGearInitialLoadInProgress || (isGearLoading && !hasGear));

  const enabledTabKeys = useMemo(() => ({
    ...TAB_KEYS,
    EVENTS: eventsEnabled ? TAB_KEYS.EVENTS : undefined,
    GEAR: hasGear ? TAB_KEYS.GEAR : undefined,
    LAYERS: shouldShowLayersTab ? TAB_KEYS.LAYERS : undefined,
    OTUS: shouldShowOtusTab ? TAB_KEYS.OTUS : undefined,
    PATROLS: canReadPatrols ? TAB_KEYS.PATROLS : undefined,
  }), [canReadPatrols, eventsEnabled, hasGear, shouldShowLayersTab, shouldShowOtusTab]);

  const isSideBarOpen = !!currentTab && Object.values(enabledTabKeys).includes(currentTab.toLowerCase());

  const onActiveOtusLinkClick = (event) => {
    if (event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
      event.preventDefault();

      navigate('/');
    }
  };

  // The tab keeps rendering its last open location while it slides out.
  if (isSideBarOpen && tabLocation?.key !== location.key) {
    setTabLocation(location);
  }

  const isSideBarClosing = !isSideBarOpen && !!tabLocation;
  const displayedPathname = (tabLocation ?? location).pathname;
  const displayedTab = getCurrentTabFromURL(displayedPathname);

  // The tab that slides out keeps its view, table or list, until it is gone.
  const { canShowTableView, isTableView, toggleTableView } = useFeedTableView(displayedTab);
  useTableViewLink();
  const isFeedDisplayed = (displayedTab === TAB_KEYS.EVENTS || displayedTab === TAB_KEYS.PATROLS)
    && !getCurrentIdFromURL(displayedPathname);

  const shouldHideDefaultHeader = (patrolSchemasEnabled
    && canReadPatrols
    && !!matchPath(detailViewPattern(TAB_KEYS.PATROLS), displayedPathname))
    || (eventsEnabled && !!matchPath(detailViewPattern(TAB_KEYS.EVENTS), displayedPathname))
    || (shouldShowOtusTab && displayedTab === TAB_KEYS.OTUS);

  const onBackButtonClick = () => {
    if (location.key === 'default' || location.state?.comesFromLogin || location.state?.comesFromLngLatRedirection) {
      navigate(tabPath(currentTab));
    } else {
      navigate(-1);
    }
  };

  const onTabTransitionEnd = (event) => {
    if (isSideBarClosing && event.target === event.currentTarget && event.propertyName === 'transform') {
      setTabLocation(null);
    }
  };

  useEffect(() => {
    if (isLegacyEventURL){
      navigate(
        eventsEnabled ? location.pathname.replace(LEGACY_EVENTS_TAB_KEY, TAB_KEYS.EVENTS) : '/',
        { replace: true }
      );
    }
  }, [eventsEnabled, isLegacyEventURL, location.pathname, navigate]);

  useEffect(() => {
    if (currentTab
      && !Object.values(enabledTabKeys).includes(currentTab.toLowerCase())
      && !isLegacyEventURL
      && !(currentTab === TAB_KEYS.GEAR && isGearStillResolving)) {
      navigate('/', { replace: true });
    }
  }, [currentTab, enabledTabKeys, isGearStillResolving, isLegacyEventURL, navigate]);

  useEffect(() => {
    if (updatedEventIds.size && currentTab === TAB_KEYS.EVENTS && !isEventDetailViewActive) {
      // Updating state from this effect is intended.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUpdatedEventIds(EMPTY_EVENT_IDS);
    }
  }, [currentTab, isEventDetailViewActive, updatedEventIds]);

  useEffect(() => {
    if (socket) {
      const addUpdatedEventId = (payload) => {
        if (payload.matches_current_filter
          && (!isSideBarOpen || currentTab !== TAB_KEYS.EVENTS || isEventDetailViewActive)) {
          setUpdatedEventIds((currentUpdatedEventIds) => currentUpdatedEventIds.has(payload.event_id)
            ? currentUpdatedEventIds
            : new Set(currentUpdatedEventIds).add(payload.event_id));
        }
      };

      const [, newEventFnRef] = socket.on('new_event', addUpdatedEventId);
      const [, updateEventFnRef] = socket.on('update_event', addUpdatedEventId);

      return () => {
        socket.off('new_event', newEventFnRef);
        socket.off('update_event', updateEventFnRef);
      };
    }
  }, [currentTab, isEventDetailViewActive, isSideBarOpen, socket]);

  useEffect(() => {
    if (isSideBarClosing) {
      const unmountTimeout = setTimeout(() => setTabLocation(null), CLOSING_UNMOUNT_DELAY);

      return () => clearTimeout(unmountTimeout);
    }
  }, [isSideBarClosing]);

  return <nav className={`${styles.sideBar} ${isSideBarShown ? '' : 'hidden'}`}>
    <div className={`${styles.verticalNav} ${isSideBarOpen ? 'open' : ''}`}>
      {eventsEnabled && <Link
        aria-label={updatedEventIds.size
          ? t('eventsLinkWithUpdatesLabel', { count: updatedEventIds.size })
          : undefined}
        className={`${styles.navItem} ${currentTab === TAB_KEYS.EVENTS ? styles.active : ''}`}
        to={tabPath(TAB_KEYS.EVENTS)}
      >
        <DocumentIcon aria-hidden="true" />

        {!!updatedEventIds.size && <Badge aria-hidden="true" className={styles.badge} count={updatedEventIds.size} />}

        <SoundNotificationsPlayer />

        <span>{t('eventsLink')}</span>
      </Link>}

      {canReadPatrols && <Link
        className={`${styles.navItem} ${currentTab === TAB_KEYS.PATROLS ? styles.active : ''}`}
        to={tabPath(TAB_KEYS.PATROLS)}
      >
        <PatrolIcon aria-hidden="true" />

        <span>{t('patrolsLink')}</span>
      </Link>}

      {hasGear && <Link
        className={`${styles.navItem} ${currentTab === TAB_KEYS.GEAR ? styles.active : ''}`}
        to={tabPath(TAB_KEYS.GEAR)}
      >
        <MarkerFeedIcon aria-hidden="true" />

        <span>{t('gearLink')}</span>
      </Link>}

      {shouldShowLayersTab && <Link
        className={`${styles.navItem} ${currentTab === TAB_KEYS.LAYERS ? styles.active : ''}`}
        to={tabPath(TAB_KEYS.LAYERS)}
      >
        <LayersIcon aria-hidden="true" />

        <span>{t('layersLink')}</span>
      </Link>}

      {shouldShowOtusTab && <Link
        className={`${styles.navItem} ${currentTab === TAB_KEYS.OTUS ? styles.active : ''}`}
        onClick={isOtusTabActive ? onActiveOtusLinkClick : undefined}
        to={tabPath(TAB_KEYS.OTUS)}
      >
        <OtusIcon aria-hidden="true" />

        <span>{t('otusLink')}</span>
      </Link>}

      <Link
        className={`${styles.navItem} ${currentTab === TAB_KEYS.SETTINGS ? styles.active : ''}`}
        to={tabPath(TAB_KEYS.SETTINGS)}
      >
        <GearIcon aria-hidden="true" />

        <span>{t('settingsLink')}</span>
      </Link>
    </div>

    <div className={`${styles.tabsContainer} ${isSideBarOpen ? 'open' : ''} ${isFeedDisplayed && isTableView ? styles.tableView : ''}`}>
      <div
        className={`${styles.tab} ${isSideBarOpen ? 'open' : ''}`}
        data-testid="sideBar-tab"
        inert={isSideBarClosing}
        onTransitionEnd={onTabTransitionEnd}
      >
        <div className={styles.printLogo}>
          <EarthRangerLogo alt="" type="horizontal" />
        </div>

        {(isSideBarOpen || isSideBarClosing) && !shouldHideDefaultHeader && <div className={styles.header}>
          <div className={styles.title}>
            {(displayedTab === TAB_KEYS.EVENTS || displayedTab === TAB_KEYS.PATROLS) && <div>
              {getCurrentIdFromURL(displayedPathname)
                ? <button
                  aria-label={t('backButtonLabel')}
                  className={styles.backButton}
                  data-testid="sideBar-backDetailViewButton"
                  onClick={onBackButtonClick}
                  title={t('backButtonTitle')}
                  type="button"
                >
                  <ArrowLeftIcon aria-hidden="true" className={styles.backButtonIcon} />
                </button>
                : <AddItemButton
                  analyticsMetadata={{ category: FEED_CATEGORY, location: 'Feed' }}
                  aria-label={t(displayedTab === TAB_KEYS.EVENTS ? 'addEventButtonLabel' : 'addPatrolButtonLabel')}
                  className={styles.addReport}
                  hideAddPatrolTab={displayedTab === TAB_KEYS.EVENTS}
                  hideAddEventTab={displayedTab === TAB_KEYS.PATROLS}
                  showLabel={false}
                  title={t(displayedTab === TAB_KEYS.EVENTS ? 'addEventButtonTitle' : 'addPatrolButtonTitle')}
                  variant="secondary"
                />}
            </div>}

            <h3 id="side-bar-tab-header">{t(`${displayedTab}Link`)}</h3>
          </div>

          <div className={styles.headerActions}>
            {isFeedDisplayed && canShowTableView && <button
              aria-label={t(isTableView ? 'showListButtonLabel' : 'showTableButtonLabel')}
              className={`${styles.tableViewButton} ${isTableView ? styles.active : ''}`}
              data-testid="sideBar-tableViewButton"
              onClick={toggleTableView}
              title={t(isTableView ? 'showListButtonLabel' : 'showTableButtonLabel')}
              type="button"
            >
              {isTableView
                ? <BulletListIcon aria-hidden="true" className={styles.tableViewButtonIcon} />
                : <TableIcon aria-hidden="true" className={styles.tableViewButtonIcon} />}
            </button>}

            <Link
              aria-label={t('closeButtonLabel')}
              className={styles.closeButton}
              title={t('closeButtonLabel')}
              to="/"
            >
              <CrossIcon aria-hidden="true" className={styles.closeButtonIcon} />
            </Link>
          </div>
        </div>}

        <div className={`${styles.tabBody} ${shouldHideDefaultHeader ? styles.noHeader : ''}`}>
          {/* Outside the routes so a tab switch keeps the frame mounted. */}
          {shouldShowOtusTab && <OtusTab isActive={displayedTab === TAB_KEYS.OTUS} url={otusUrl} />}

          <Routes location={tabLocation ?? location}>
            {/* Gets rid of warning */}
            <Route path="/" element={null} />

            {eventsEnabled && <Route
              element={<EventsManager eventsFeed={eventsFeed} />}
              path={`${TAB_KEYS.EVENTS}/*`}
            />}

            {/* Legacy patrol routes */}
            {canReadPatrols && !patrolSchemasEnabled && <Route path={TAB_KEYS.PATROLS}>
              <Route index element={<PatrolsFeed />} />

              <Route path=":id/*" element={<PatrolDetailView />} />
            </Route>}

            {/* New patrol routes */}
            {canReadPatrols && patrolSchemasEnabled && <Route
              element={<PatrolsManager />}
              path={`${TAB_KEYS.PATROLS}/*`}
            />}

            {hasGear && <Route path={TAB_KEYS.GEAR} element={<div className={styles.gearRouteBody}>
              <GearTab />
            </div>} />}

            {shouldShowLayersTab && <Route path={TAB_KEYS.LAYERS} element={<MapLayersTab />} />}

            {shouldShowOtusTab && <Route path={TAB_KEYS.OTUS} element={null} />}

            <Route path={TAB_KEYS.SETTINGS} element={<SettingsPane />} />
          </Routes>
        </div>
      </div>
    </div>
  </nav>;
};

export default memo(SideBar);
