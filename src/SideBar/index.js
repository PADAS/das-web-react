import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { matchPath, Route, Routes, useLocation } from 'react-router';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowLeftIcon } from '../common/images/icons/arrow-left.svg';
import { ReactComponent as CrossIcon } from '../common/images/icons/cross.svg';
import { ReactComponent as DocumentIcon } from '../common/images/icons/document.svg';
import { ReactComponent as ERLogo } from '../common/images/icons/er-logo.svg';
import { ReactComponent as GearIcon } from '../common/images/icons/gear.svg';
import { ReactComponent as LayersIcon } from '../common/images/icons/layers.svg';
import { ReactComponent as MarkerFeedIcon } from '../common/images/icons/marker-feed.svg';
import { ReactComponent as PatrolIcon } from '../common/images/icons/patrol.svg';

import { getCurrentIdFromURL, getCurrentTabFromURL } from '../utils/navigation';
import { FEED_CATEGORY } from '../utils/analytics';
import { SocketContext } from '../withSocketConnection';
import { SYSTEM_CONFIG_FLAGS, TAB_KEYS } from '../constants';
import { usePatrolsPermissions } from '../hooks/usePermissions';
import useFetchPatrolsFeed from './useFetchPatrolsFeed';
import useNavigate from '../hooks/useNavigate';
import useReportsFeed from './useReportsFeed';

import AddItemButton from '../AddItemButton';
import BadgeIcon from '../Badge';
import Link from '../Link';
import PatrolDetailView from '../PatrolDetailView';
import PatrolLegDetailView from '../PatrolLegDetailView';
import PatrolOverview from '../PatrolOverview';
import PatrolForm from '../PatrolForm';
import ReportManager from '../ReportManager';
import SoundNotificationsPlayer from '../SoundNotificationsPlayer';

import GearTab from './GearTab';
import MapLayersTab from './MapLayersTab';
import PatrolsFeedTab from './PatrolsFeedTab';
import ReportsFeedTab from './ReportsFeedTab';
import SettingsPane from './SettingsPane';

import * as styles from './styles.module.scss';

const CLOSE_BUTTON_LABEL_KEY = {
  [TAB_KEYS.EVENTS]: 'closeEventFeedButtonLabel',
  [TAB_KEYS.GEAR]: 'closeGearTabButtonLabel',
  [TAB_KEYS.LAYERS]: 'closeMapLayersButtonLabel',
  [TAB_KEYS.PATROLS]: 'closePatrolFeedButtonLabel',
  [TAB_KEYS.SETTINGS]: 'closeSettingsButtonLabel',
};

const legacyEventsURL = 'reports';

const SideBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('components', { keyPrefix: 'sideBar' });

  const socket = useContext(SocketContext);

  const patrolsFeed = useFetchPatrolsFeed();
  const reportsFeed = useReportsFeed();

  const analyzersEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.ANALYZERS]);
  const eventsEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.EVENTS]);
  const isPickingLocation = useSelector((state) => state.view.mapLocationSelection.isPickingLocation);
  const {
    gearEndpointUnavailable,
    hasGear,
    initialLoadInProgress,
    loading: gearLoading,
  } = useSelector((state) => state.data.gear);
  const patrolManagementEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]);
  const sideBar = useSelector((state) => state.view.sideBar);
  const spatialFeaturesEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.SPATIAL_FEATURES]);
  const subjectsEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.SUBJECTS]);

  const { hasPatrolsReadPermission } = usePatrolsPermissions();

  const sideBarRef = useRef();

  const [showEventsBadge, setShowEventsBadge] = useState(false);
  const [reportIsBeingAdded, setReportIsBeingAdded] = useState(false);

  const canReadPatrols = patrolManagementEnabled && hasPatrolsReadPermission;

  const currentTab = getCurrentTabFromURL(location.pathname);
  const itemId = getCurrentIdFromURL(location.pathname);

  const isLegacyEventURL = currentTab === legacyEventsURL;
  // Hide the layers tab if all map features are disabled.
  const showLayersTab = analyzersEnabled || spatialFeaturesEnabled || subjectsEnabled || eventsEnabled;

  const isPatrolDetailsViewActive = canReadPatrols
    && !!matchPath(`/${TAB_KEYS.PATROLS}/:id`, location.pathname);
  const isPatrolLegDetailViewActive = canReadPatrols
    && !!matchPath(`/${TAB_KEYS.PATROLS}/:id/legs/:legIndex`, location.pathname);
  const isPatrolOverviewActive = canReadPatrols
    && !!matchPath(`/${TAB_KEYS.PATROLS}/:id`, location.pathname);
  const isPatrolFormActive = canReadPatrols
    && (!!matchPath(`/${TAB_KEYS.PATROLS}/new`, location.pathname)
      || !!matchPath(`/${TAB_KEYS.PATROLS}/:id/legs/new`, location.pathname)
      || !!matchPath(`/${TAB_KEYS.PATROLS}/:id/legs/:legIndex/edit`, location.pathname));
  const isReportDetailsViewActive = eventsEnabled
    && !!matchPath(`/${TAB_KEYS.EVENTS}/:id`, location.pathname);


  const showGearTab = hasGear;

  const gearStillResolving = !gearEndpointUnavailable
    && (initialLoadInProgress || (gearLoading && !hasGear));

  const enabledTabKeys = useMemo(() => ({
    ...TAB_KEYS,
    EVENTS: eventsEnabled ? TAB_KEYS.EVENTS : undefined,
    GEAR: showGearTab ? TAB_KEYS.GEAR : undefined,
    LAYERS: showLayersTab ? TAB_KEYS.LAYERS : undefined,
    PATROLS: canReadPatrols ? TAB_KEYS.PATROLS : undefined,
  }), [canReadPatrols, eventsEnabled, showGearTab, showLayersTab]);

  // If there is a current tab and it is in the enabled tab keys, the side bar
  // is open.
  const isSideBarOpen = currentTab && Object.values(enabledTabKeys).includes(currentTab.toLowerCase());

  const onClickBackFromDetailView = useCallback(() => {
    if (reportIsBeingAdded) {
      return navigate(location.pathname, { replace: true });
    }

    if (eventsEnabled && location.state?.relatedEvent) {
      return navigate(`/${TAB_KEYS.EVENTS}/${location.state.relatedEvent}`, {
        replace: true
      });
    }

    if (location.key === 'default' || location.state?.comesFromLogin || location.state?.comesFromLngLatRedirection) {
      return navigate(`/${getCurrentTabFromURL(location.pathname)}`, {});
    }

    return navigate(-1, {});
  }, [
    eventsEnabled,
    location.key,
    location.pathname,
    location.state?.comesFromLngLatRedirection,
    location.state?.comesFromLogin,
    location.state?.relatedEvent,
    navigate,
    reportIsBeingAdded,
  ]);

  useEffect(() => {
    if (isLegacyEventURL){
      navigate(
        eventsEnabled ? location.pathname.replace(legacyEventsURL, TAB_KEYS.EVENTS) : '/',
        { replace: true }
      );
    }
  }, [eventsEnabled, isLegacyEventURL, location.pathname, navigate]);

  useEffect(() => {
    if (currentTab
      && !Object.values(enabledTabKeys).includes(currentTab.toLowerCase())
      && !isLegacyEventURL
      && !(currentTab === TAB_KEYS.GEAR && gearStillResolving)) {
      navigate('/', { replace: true });
    }
  }, [currentTab, enabledTabKeys, gearStillResolving, isLegacyEventURL, navigate]);

  useEffect(() => {
    if (showEventsBadge && currentTab === TAB_KEYS.EVENTS && !isReportDetailsViewActive) {
      setShowEventsBadge(false);
    }
  }, [currentTab, isReportDetailsViewActive, showEventsBadge]);

  useEffect(() => {
    if (socket) {
      const updateEventsBadge = ({ matches_current_filter }) => {
        if (matches_current_filter
          && (!isSideBarOpen || currentTab !== TAB_KEYS.EVENTS || isReportDetailsViewActive)) {
          setShowEventsBadge(true);
        }
      };

      const [, newEventFnRef] = socket.on('new_event', updateEventsBadge);
      const [, updateEventFnRef] = socket.on('update_event', updateEventsBadge);

      return () => {
        socket.off('new_event', newEventFnRef);
        socket.off('update_event', updateEventFnRef);
      };
    }
  }, [currentTab, isReportDetailsViewActive, isSideBarOpen, socket]);

  // NOTE: This is getting unmaintainable. Is it really a good practice to use escape like a navigation key?
  useEffect(() => {
    const onKeydown = (event) => {
      const wasEscapePressed = event.key === 'Escape';
      const isDetailsViewActive = isReportDetailsViewActive || isPatrolDetailsViewActive;
      const isSideBarFocused = sideBarRef.current.contains(document.activeElement);
      if (wasEscapePressed && isDetailsViewActive && isSideBarFocused && !isPickingLocation) {
        navigate(`/${getCurrentTabFromURL(location.pathname)}`);
      }
    };

    document.addEventListener('keydown', onKeydown, false);

    return () => document.removeEventListener('keydown', onKeydown, false);
  }, [isPatrolDetailsViewActive, isPickingLocation, isReportDetailsViewActive, location.pathname, navigate]);

  useEffect(() => {
    sideBarRef.current.focus();
  }, [itemId]);

  return <nav
      className={`${styles.sideBar} ${sideBar.showSideBar ? '' : 'hidden'}`}
      ref={sideBarRef}
      tabIndex={0}
    >
    <div className={`${styles.verticalNav} ${isSideBarOpen ? 'open' : ''}`}>
      {eventsEnabled && <Link
        className={`${styles.navItem} ${currentTab === TAB_KEYS.EVENTS ? styles.active : ''}`}
        to={`/${TAB_KEYS.EVENTS}`}
      >
        <DocumentIcon />

        {!!showEventsBadge && <BadgeIcon className={styles.badge} />}

        <SoundNotificationsPlayer />

        <span>{t('eventsLink')}</span>
      </Link>}

      {canReadPatrols && <Link
        className={`${styles.navItem} ${currentTab === TAB_KEYS.PATROLS ? styles.active : ''}`}
        to={`/${TAB_KEYS.PATROLS}`}
      >
        <PatrolIcon />

        <span>{t('patrolsLink')}</span>
      </Link>}

      {showGearTab && <Link
        className={`${styles.navItem} ${currentTab === TAB_KEYS.GEAR ? styles.active : ''}`}
        to={`/${TAB_KEYS.GEAR}`}
      >
        <MarkerFeedIcon />

        <span>{t('gearLink')}</span>
      </Link>}

      {showLayersTab && <Link
        className={`${styles.navItem} ${currentTab === TAB_KEYS.LAYERS ? styles.active : ''}`}
        to={`/${TAB_KEYS.LAYERS}`}
      >
        <LayersIcon />

        <span>{t('layersLink')}</span>
      </Link>}

      <Link
        className={`${styles.navItem} ${currentTab === TAB_KEYS.SETTINGS ? styles.active : ''}`}
        to={`/${TAB_KEYS.SETTINGS}`}
      >
        <GearIcon />

        <span>{t('settingsLink')}</span>
      </Link>
    </div>

    <div className={`${styles.tabsContainer} ${isSideBarOpen ? 'open' : ''}`}>
      <div className={`${styles.tab}  ${isSideBarOpen ? 'open' : ''}`}>
        <div className={styles.printLogo}>
          <ERLogo />
        </div>

        {!isPatrolLegDetailViewActive && !isPatrolOverviewActive && !isPatrolFormActive && (<div className={styles.header}>
          <div className={styles.title}>
            {(currentTab === TAB_KEYS.EVENTS || currentTab === TAB_KEYS.PATROLS) && <div>
              {!!itemId
                ? <button
                  aria-label={t('backButtonLabel')}
                  className={styles.backButton}
                  type='button'
                  onClick={onClickBackFromDetailView}
                  title={t('backButtonTitle')}
                  data-testid="sideBar-backDetailViewButton"
                >
                  <ArrowLeftIcon />
                </button>
                : <AddItemButton
                  analyticsMetadata={{ category: FEED_CATEGORY, location: 'Feed' }}
                  aria-label={t(currentTab === TAB_KEYS.EVENTS ? 'addEventButtonLabel' : 'addPatrolButtonLabel')}
                  className={styles.addReport}
                  hideAddPatrolTab={currentTab === TAB_KEYS.EVENTS}
                  hideAddEventTab={currentTab === TAB_KEYS.PATROLS}
                  showLabel={false}
                  title={t(currentTab === TAB_KEYS.EVENTS ? 'addEventButtonTitle' : 'addPatrolButtonTitle')}
                  variant="secondary"
                />}
            </div>}

            <h3 id="side-bar-tab-header">{t(`${currentTab}Link`)}</h3>
          </div>

          <button
            aria-label={t(CLOSE_BUTTON_LABEL_KEY[currentTab])}
            onClick={() => navigate('/')}
            title={t('closeButtonTitle')}
          >
            <CrossIcon />
          </button>
        </div>)}

        <div className={`${styles.tabBody} ${isPatrolLegDetailViewActive || isPatrolOverviewActive || isPatrolFormActive ? styles.tabBodyFullHeight : ''}`}>
          <Routes>
            {/* Gets rid of warning */}
            <Route path="/" element={null} />

            {eventsEnabled && <Route path={TAB_KEYS.EVENTS}>
              <Route index element={<ReportsFeedTab
                events={reportsFeed.events}
                feedSort={reportsFeed.feedSort}
                loadFeedEvents={reportsFeed.loadFeedEvents}
                loadingEventFeed={reportsFeed.loadingEventFeed}
                setFeedSort={reportsFeed.setFeedSort}
                shouldExcludeContained={reportsFeed.shouldExcludeContained}
              />} />

              <Route path=":id/*" element={<ReportManager onReportBeingAdded={setReportIsBeingAdded} />} />
            </Route>}

            {canReadPatrols && <Route path={TAB_KEYS.PATROLS}>
              <Route index element={<PatrolsFeedTab loadingPatrolsFeed={patrolsFeed.loadingPatrolsFeed} />} />

              <Route path="new" element={<PatrolForm />} />

              <Route path=":id/legs/new" element={<PatrolForm />} />

              <Route path=":id/legs/:legIndex/edit" element={<PatrolForm />} />

              <Route path=":id/legs/:legIndex" element={<PatrolLegDetailView />} />

              <Route path=":id" element={<PatrolOverview />} />

              <Route path=":id/*" element={<PatrolDetailView />} />
            </Route>}

            {showGearTab && <Route path={TAB_KEYS.GEAR} element={<div className={styles.gearRouteBody}>
              <GearTab />
            </div>} />}

            {showLayersTab && <Route path={TAB_KEYS.LAYERS} element={<MapLayersTab />} />}

            <Route path={TAB_KEYS.SETTINGS} element={<SettingsPane />} />
          </Routes>
        </div>
      </div>
    </div>
  </nav>;
};

export default memo(SideBar);
