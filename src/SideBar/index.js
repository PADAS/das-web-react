import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { matchPath, Route, Routes, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowLeftIcon } from '../common/images/icons/arrow-left.svg';
import { ReactComponent as CrossIcon } from '../common/images/icons/cross.svg';
import { ReactComponent as DocumentIcon } from '../common/images/icons/document.svg';
import { ReactComponent as LayersIcon } from '../common/images/icons/layers.svg';
import { ReactComponent as PatrolIcon } from '../common/images/icons/patrol.svg';
import { ReactComponent as GearIcon } from '../common/images/icons/gear.svg';

import { SYSTEM_CONFIG_FLAGS, PERMISSION_KEYS, PERMISSIONS, TAB_KEYS } from '../constants';
import { getCurrentIdFromURL, getCurrentTabFromURL } from '../utils/navigation';
import { MapContext } from '../App';
import { SocketContext } from '../withSocketConnection';
import { useSystemConfigFlag, usePermissions } from '../hooks';
import useFetchPatrolsFeed from './useFetchPatrolsFeed';
import useNavigate from '../hooks/useNavigate';
import useReportsFeed from './useReportsFeed';

import AddItemButton from '../AddItemButton';
import AnalyzerLayerList from '../AnalyzerLayerList';
import BadgeIcon from '../Badge';
import ClearAllControl from '../ClearAllControl';
import ErrorBoundary from '../ErrorBoundary';
import FeatureLayerList from '../FeatureLayerList';
import Link from '../Link';
import MapLayerFilter from '../MapLayerFilter';
import NewEventNotifier from '../NewEventNotifier';
import PatrolDetailView from '../PatrolDetailView';
import ReportManager from '../ReportManager';
import ReportMapControl from '../ReportMapControl';
import SubjectGroupList from '../SubjectGroupList';

import PatrolsFeedTab from './PatrolsFeedTab';
import ReportsFeedTab from './ReportsFeedTab';
import SettingsPane from './SettingsPane';

import styles from './styles.module.scss';

const SideBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('components', { keyPrefix: 'sideBar' });

  const hasPatrolViewPermissions = usePermissions(PERMISSION_KEYS.PATROLS, PERMISSIONS.READ);
  const patrolFlagEnabled = useSystemConfigFlag(SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT);

  const patrolsFeed = useFetchPatrolsFeed();
  const reportsFeed = useReportsFeed();

  const map = useContext(MapContext);
  const socket = useContext(SocketContext);

  const sideBar = useSelector((state) => state.view.sideBar);

  const [showEventsBadge, setShowEventsBadge] = useState(false);
  const [reportIsBeingAdded, setReportIsBeingAdded] = useState(false);

  const currentTab = getCurrentTabFromURL(location.pathname);
  const itemId = getCurrentIdFromURL(location.pathname);

  const isSettingsViewActive = !!matchPath(`/${TAB_KEYS.SETTINGS}`, location.pathname);

  const isReportDetailsViewActive = useMemo(() => !!matchPath(
    `/${TAB_KEYS.REPORTS}/:id`,
    location.pathname
  ), [location.pathname]);
  const hasRouteHistory = useMemo(() => location.key !== 'default', [location]);
  const sidebarOpen = !!currentTab;

  const showPatrols = useMemo(
    () => !!patrolFlagEnabled && !!hasPatrolViewPermissions,
    [hasPatrolViewPermissions, patrolFlagEnabled]
  );

  const onClickBackFromDetailView = useCallback(() => {
    if (reportIsBeingAdded) {
      return navigate(location.pathname, { replace: true });
    }
    if (location.state?.relatedEvent) {
      return navigate(`/${TAB_KEYS.REPORTS}/${location.state.relatedEvent}`, {
        replace: true
      });
    }
    if (!hasRouteHistory || location.state?.comesFromLogin || location.state?.comesFromLngLatRedirection) {
      return navigate(`/${getCurrentTabFromURL(location.pathname)}`, {});
    }

    return navigate(-1, {});
  }, [hasRouteHistory, location, navigate, reportIsBeingAdded]);

  const handleCloseSideBar = useCallback(() => navigate('/'), [navigate]);

  useEffect(() => {
    if (!!currentTab && !Object.values(TAB_KEYS).includes(currentTab.toLowerCase())) {
      navigate('/', { replace: true });
    }
  }, [currentTab, navigate]);

  useEffect(() => {
    if (showEventsBadge && currentTab === TAB_KEYS.REPORTS && !isReportDetailsViewActive) {
      setShowEventsBadge(false);
    }
  }, [showEventsBadge, currentTab, isReportDetailsViewActive]);

  useEffect(() => {
    if (socket) {
      const updateEventsBadge = ({ matches_current_filter }) => {
        if (matches_current_filter && (isReportDetailsViewActive || currentTab !== TAB_KEYS.REPORTS || !sidebarOpen)) {
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
  }, [sidebarOpen, currentTab, socket, isReportDetailsViewActive]);

  return <aside className={`${styles.sideBar} ${sideBar.showSideBar ? '' : 'hidden'}`}>
    <div className={`${styles.verticalNav} ${sidebarOpen ? 'open' : ''}`}>
      <Link className={styles.navItem} to={TAB_KEYS.REPORTS}>
        <DocumentIcon />
        {!!showEventsBadge && <BadgeIcon className={styles.badge} />}
        <NewEventNotifier />
        <span>{t('reportsLink')}</span>
      </Link>

      {showPatrols && <Link className={styles.navItem} to={TAB_KEYS.PATROLS}>
        <PatrolIcon />
        <span>{t('patrolsLink')}</span>
      </Link>}

      <Link className={styles.navItem} to={TAB_KEYS.LAYERS}>
        <LayersIcon />
        <span>{t('layersLink')}</span>
      </Link>

      <Link className={styles.navItem} to={TAB_KEYS.SETTINGS}>
        <GearIcon />
        <span>{t('settingsLink')}</span>
      </Link>
    </div>

    <div className={`${styles.tabsContainer} ${sidebarOpen ? 'open' : ''}`}>
      <div className={`${styles.tab}  ${sidebarOpen ? 'open' : ''}`}>
        <div className={styles.header}>
          <div className={[TAB_KEYS.REPORTS, TAB_KEYS.PATROLS].includes(currentTab) ? '' : 'hidden'} data-testid="sideBar-addReportButton">
            {!!itemId
              ? <button
                className={styles.backButton}
                type='button'
                onClick={onClickBackFromDetailView}
                data-testid="sideBar-backDetailViewButton"
              >
                <ArrowLeftIcon />
              </button>
              : <AddItemButton
                className={styles.addReport}
                hideAddPatrolTab={currentTab === TAB_KEYS.REPORTS}
                hideAddReportTab={currentTab === TAB_KEYS.PATROLS}
                showLabel={false}
                variant="secondary"
              />}
          </div>

          <h3>{t(`${currentTab}Link`)}</h3>

          <button data-testid="sideBar-closeButton" onClick={handleCloseSideBar}>
            <CrossIcon />
          </button>
        </div>

        <div className={`${styles.tabBody} ${isSettingsViewActive ? styles.alertsTabBody : ''}`}>
          <Routes>
            {/* Gets rid of warning */}
            <Route path="/" element={null} />

            <Route path="reports">
              <Route index element={<ReportsFeedTab
                events={reportsFeed.events}
                feedSort={reportsFeed.feedSort}
                loadFeedEvents={reportsFeed.loadFeedEvents}
                loadingEventFeed={reportsFeed.loadingEventFeed}
                setFeedSort={reportsFeed.setFeedSort}
                shouldExcludeContained={reportsFeed.shouldExcludeContained}
              />} />

              <Route path=":id/*" element={<ReportManager onReportBeingAdded={setReportIsBeingAdded} />} />
            </Route>

            <Route path="patrols">
              <Route index element={<PatrolsFeedTab loadingPatrolsFeed={patrolsFeed.loadingPatrolsFeed} />} />

              <Route path=":id/*" element={<PatrolDetailView />} />
            </Route>

            <Route
              path="layers"
              element={<ErrorBoundary>
                <MapLayerFilter />

                <div className={styles.mapLayers}>
                  <ReportMapControl />
                  <SubjectGroupList map={map} />
                  <FeatureLayerList map={map} />
                  <AnalyzerLayerList map={map} />
                  <div className={styles.noItems}>{t('noItemsToDisplayInLayers')}</div>
                </div>

                <div className={styles.mapLayerFooter}>
                  <ClearAllControl map={map} />
                </div>
              </ErrorBoundary>}
            />

            <Route path="settings"
              element={
                <SettingsPane />
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  </aside>;
};

export default memo(SideBar);
