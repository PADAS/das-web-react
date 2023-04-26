import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { matchPath, Route, Routes, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { ReactComponent as ArrowLeftIcon } from '../common/images/icons/arrow-left.svg';
import { ReactComponent as CrossIcon } from '../common/images/icons/cross.svg';
import { ReactComponent as DocumentIcon } from '../common/images/icons/document.svg';
import { ReactComponent as LayersIcon } from '../common/images/icons/layers.svg';
import { ReactComponent as PatrolIcon } from '../common/images/icons/patrol.svg';

import { SYSTEM_CONFIG_FLAGS, PERMISSION_KEYS, PERMISSIONS, TAB_KEYS } from '../constants';
import { getCurrentIdFromURL, getCurrentTabFromURL } from '../utils/navigation';
import { MapContext } from '../App';
import { SocketContext } from '../withSocketConnection';
import { useSystemConfigFlag, usePermissions } from '../hooks';
import useFetchPatrolsFeed from './useFetchPatrolsFeed';
import useFetchReportsFeed from './useFetchReportsFeed';
import useNavigate from '../hooks/useNavigate';

import AddReport, { STORAGE_KEY as ADD_BUTTON_STORAGE_KEY } from '../AddReport';
import AnalyzerLayerList from '../AnalyzerLayerList';
import BadgeIcon from '../Badge';
import ClearAllControl from '../ClearAllControl';
import ErrorBoundary from '../ErrorBoundary';
import FeatureLayerList from '../FeatureLayerList';
import Link from '../Link';
import MapLayerFilter from '../MapLayerFilter';
import PatrolDetailView from '../PatrolDetailView';
import ReportManager from '../ReportManager';
import ReportMapControl from '../ReportMapControl';
import SubjectGroupList from '../SubjectGroupList';

import PatrolsFeedTab from './PatrolsFeedTab';
import ReportsFeedTab from './ReportsFeedTab';

import styles from './styles.module.scss';

const VALID_ADD_REPORT_TYPES = [TAB_KEYS.REPORTS, TAB_KEYS.PATROLS];

const SideBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const sideBar = useSelector((state) => state.view.sideBar);

  const patrolsFeed = useFetchPatrolsFeed();
  const reportsFeed = useFetchReportsFeed();
  const patrolFlagEnabled = useSystemConfigFlag(SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT);
  const hasPatrolViewPermissions = usePermissions(PERMISSION_KEYS.PATROLS, PERMISSIONS.READ);

  const map = useContext(MapContext);
  const socket = useContext(SocketContext);

  const currentTab = getCurrentTabFromURL(location.pathname);
  const itemId = getCurrentIdFromURL(location.pathname);

  const isReportDetailsViewActive = useMemo(() => !!matchPath(
      `/${TAB_KEYS.REPORTS}/:id`,
      location.pathname
  ), [location.pathname]);

  const sidebarOpen = !!currentTab;

  const [showEventsBadge, setShowEventsBadge] = useState(false);

  const showPatrols = useMemo(
    () => !!patrolFlagEnabled && !!hasPatrolViewPermissions,
    [hasPatrolViewPermissions, patrolFlagEnabled]
  );

  const tabTitle = useMemo(() => {
    switch (currentTab) {
    case TAB_KEYS.REPORTS:
      return 'Reports';
    case TAB_KEYS.PATROLS:
      return 'Patrols';
    case TAB_KEYS.LAYERS:
      return 'Map Layers';
    default:
      return '';
    }
  }, [currentTab]);

  const handleCloseSideBar = useCallback(() => navigate('/'), [navigate]);

  const onClickBackFromDetailView = useCallback(() => navigate(`/${currentTab}`), [currentTab, navigate]);

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
        if (matches_current_filter && (isReportDetailsViewActive || currentTab !== TAB_KEYS.REPORTS || !sidebarOpen) ) {
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

  useEffect(() => {
    if (VALID_ADD_REPORT_TYPES.includes(currentTab)) {
      window.localStorage.setItem(ADD_BUTTON_STORAGE_KEY, currentTab);
    }
  }, [currentTab]);

  return <ErrorBoundary>
    <aside className={`${styles.sideBar} ${sideBar.showSideBar ? '' : 'hidden'}`}>
      <div className={`${styles.verticalNav} ${sidebarOpen ? 'open' : ''}`}>
        <Link className={styles.navItem} to={currentTab === TAB_KEYS.REPORTS ? '' : 'reports'}>
          <DocumentIcon />
          {!!showEventsBadge && <BadgeIcon className={styles.badge} />}
          <span>Reports</span>
        </Link>

        {showPatrols && <Link className={styles.navItem} to={currentTab === TAB_KEYS.PATROLS ? '' : 'patrols'}>
          <PatrolIcon />
          <span>Patrols</span>
        </Link>}

        <Link className={styles.navItem} to={currentTab === TAB_KEYS.LAYERS ? '' : 'layers'}>
          <LayersIcon />
          <span>Map Layers</span>
        </Link>
      </div>

      <div className={`${styles.tabsContainer} ${sidebarOpen ? 'open' : ''}`}>
        <div className={`${styles.tab}  ${sidebarOpen ? 'open' : ''}`}>
          <div className={styles.header}>
            <div className={currentTab === TAB_KEYS.LAYERS ? 'hidden' : ''} data-testid="sideBar-addReportButton">
              {!!itemId
                ? <button
                  className={styles.backButton}
                  type='button'
                  onClick={onClickBackFromDetailView}
                  data-testid="sideBar-backDetailViewButton"
                >
                  <ArrowLeftIcon />
                </button>
                : <AddReport
                  className={styles.addReport}
                  variant="secondary"
                  formProps={{ hidePatrols: currentTab !== TAB_KEYS.PATROLS }}
                  hideReports={currentTab !== TAB_KEYS.REPORTS}
                  popoverPlacement="bottom"
                  showLabel={false}
                  type={currentTab}
                />}
            </div>

            <h3>{tabTitle}
              <Routes>
                <Route path="reports">
                  <Route path=":id/*" element={<span className={styles.betaPreviewLabel}> (Beta Preview)</span>} />
                </Route>
              </Routes>
            </h3>

            <button data-testid="sideBar-closeButton" onClick={handleCloseSideBar}>
              <CrossIcon />
            </button>
          </div>

          <div className={styles.tabBody}>
            <Routes>
              {/* Gets rid of warning */}
              <Route path="/" element={null} />

              <Route path="reports">
                <Route index element={<ReportsFeedTab
                  feedSort={reportsFeed.feedSort}
                  loadFeedEvents={reportsFeed.loadFeedEvents}
                  loadingEventFeed={reportsFeed.loadingEventFeed}
                  setFeedSort={reportsFeed.setFeedSort}
                  shouldExcludeContained={reportsFeed.shouldExcludeContained}
                />} />

                <Route path=":id/*" element={<ReportManager />} />
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
                    <ReportMapControl/>
                    <SubjectGroupList map={map} />
                    <FeatureLayerList map={map} />
                    <AnalyzerLayerList map={map} />
                    <div className={styles.noItems}>No items to display.</div>
                  </div>

                  <div className={styles.mapLayerFooter}>
                    <ClearAllControl map={map} />
                  </div>
                </ErrorBoundary>}
              />
            </Routes>
          </div>
        </div>
      </div>
    </aside>
  </ErrorBoundary>;
};

export default memo(SideBar);
