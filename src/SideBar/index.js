import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cloneDeep } from 'lodash-es';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import {
  FEATURE_FLAGS,
  PERMISSION_KEYS,
  PERMISSIONS,
  TAB_KEYS,
} from '../constants';
import { fetchPatrols } from '../ducks/patrols';
import { getPatrolList } from '../selectors/patrols';
import { SocketContext } from '../withSocketConnection';
import { getCurrentIdFromURL, getCurrentTabFromURL } from '../utils/navigation';
import { useFeatureFlag, usePermissions } from '../hooks';
import useNavigate from '../hooks/useNavigate';

import AddReport, { STORAGE_KEY as ADD_BUTTON_STORAGE_KEY } from '../AddReport';
import AnalyzerLayerList from '../AnalyzerLayerList';
import BadgeIcon from '../Badge';
import ClearAllControl from '../ClearAllControl';
import ErrorBoundary from '../ErrorBoundary';
import FeatureLayerList from '../FeatureLayerList';
import MapLayerFilter from '../MapLayerFilter';
import PatrolDetailView from '../PatrolDetailView';
import ReportDetailView from '../ReportDetailView';
import ReportMapControl from '../ReportMapControl';
import SubjectGroupList from '../SubjectGroupList';

import PatrolsTab from './PatrolsTab';
import ReportsTab from './ReportsTab';

import { ReactComponent as CrossIcon } from '../common/images/icons/cross.svg';
import { ReactComponent as DocumentIcon } from '../common/images/icons/document.svg';
import { ReactComponent as LayersIcon } from '../common/images/icons/layers.svg';
import { ReactComponent as PatrolIcon } from '../common/images/icons/patrol.svg';
import { ReactComponent as ArrowLeftIcon } from '../common/images/icons/arrow-left.svg';

import styles from './styles.module.scss';

const VALID_ADD_REPORT_TYPES = [TAB_KEYS.REPORTS, TAB_KEYS.PATROLS];

const SideBar = ({ map }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const patrolFilter = useSelector((state) => state.data.patrolFilter);
  const patrols = useSelector((state) => getPatrolList(state));
  const sideBar = useSelector((state) => state.view.sideBar);

  const patrolFlagEnabled = useFeatureFlag(FEATURE_FLAGS.PATROL_MANAGEMENT);
  const hasPatrolViewPermissions = usePermissions(PERMISSION_KEYS.PATROLS, PERMISSIONS.READ);

  const socket = useContext(SocketContext);

  const currentTab = getCurrentTabFromURL(location.pathname);
  const itemId = getCurrentIdFromURL(location.pathname);

  const sidebarOpen = !!currentTab;

  const patrolFetchRef = useRef(null);

  const [loadingPatrols, setPatrolLoadState] = useState(true);
  const [showEventsBadge, setShowEventsBadge] = useState(false);

  const showPatrols = useMemo(
    () => !!patrolFlagEnabled && !!hasPatrolViewPermissions,
    [hasPatrolViewPermissions, patrolFlagEnabled]
  );

  const patrolFilterParams = useMemo(() => {
    const filterParams = cloneDeep(patrolFilter);
    delete filterParams.filter.overlap;

    return filterParams;
  }, [patrolFilter]);

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

  const fetchAndLoadPatrolData = useCallback(() => {
    patrolFetchRef.current = dispatch(fetchPatrols());

    patrolFetchRef.current.request
      .finally(() => {
        setPatrolLoadState(false);
        patrolFetchRef.current = null;
      });

  }, [dispatch]);

  const handleCloseSideBar = useCallback(() => navigate('/'), [navigate]);

  const onClickBackFromDetailView = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  useEffect(() => {
    if (!!currentTab && !Object.values(TAB_KEYS).includes(currentTab.toLowerCase())) {
      navigate('/', { replace: true });
    }
  }, [currentTab, navigate]);

  useEffect(() => {
    if (showEventsBadge && sidebarOpen && currentTab === TAB_KEYS.REPORTS) {
      setShowEventsBadge(false);
    }
  }, [showEventsBadge, sidebarOpen, currentTab]);

  useEffect(() => {
    if (socket) {
      const updateEventsBadge = ({ matches_current_filter }) => {
        if (matches_current_filter && (currentTab !== TAB_KEYS.REPORTS || !sidebarOpen)) {
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
  }, [sidebarOpen, currentTab, socket]);

  // fetch patrols if filter itself has changed
  useEffect(() => {
    if (showPatrols) {
      setPatrolLoadState(true);
      fetchAndLoadPatrolData();
      return () => {
        const priorRequestCancelToken = patrolFetchRef?.current?.cancelToken;

        if (priorRequestCancelToken) {
          priorRequestCancelToken.cancel();
        }
      };
    }
  }, [fetchAndLoadPatrolData, patrolFilterParams, showPatrols]);

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

            <h3>{tabTitle}</h3>

            <button data-testid="sideBar-closeButton" onClick={handleCloseSideBar}>
              <CrossIcon />
            </button>
          </div>

          <div className={styles.tabBody}>
            <Routes>
              {/* Gets rid of warning */}
              <Route path="/" element={null} />

              <Route
                path="reports"
                element={<ReportsTab map={map} sidebarOpen={sidebarOpen} className={styles.reportsTab}/>}
              >
                <Route path=":id/*" element={<ReportDetailView />} />
              </Route>

              <Route
                path="patrols"
                element={<PatrolsTab loadingPatrols={loadingPatrols} map={map} patrolResults={patrols.results} />}
              >
                <Route
                  path=":id/*"
                  element={<PatrolDetailView className={styles.patrolDetailView} />}
                />
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

SideBar.propTypes = { map: PropTypes.object.isRequired };

export default memo(SideBar);
