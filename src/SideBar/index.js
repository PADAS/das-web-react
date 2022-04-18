import React, {
  lazy,
  memo,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { cloneDeep } from 'lodash-es';
import isEqual from 'react-fast-compare';
import isUndefined from 'lodash/isUndefined';
import { MapContext } from 'react-mapbox-gl';
import Nav from 'react-bootstrap/Nav';
import PropTypes from 'prop-types';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { useDispatch, useSelector } from 'react-redux';

import {
  BREAKPOINTS,
  DEVELOPMENT_FEATURE_FLAGS,
  FEATURE_FLAGS,
  PERMISSION_KEYS,
  PERMISSIONS,
  TAB_KEYS,
} from '../constants';
import { fetchPatrols } from '../ducks/patrols';
import { getPatrolList } from '../selectors/patrols';
import { hideDetailView, openTab } from '../ducks/side-bar';
import { INITIAL_FILTER_STATE } from '../ducks/event-filter';
import { SocketContext } from '../withSocketConnection';
import { trackEventFactory, DRAWER_CATEGORY } from '../utils/analytics';
import undoable, { calcInitialUndoableState, undo } from '../reducers/undoable';
import { updateUserPreferences } from '../ducks/user-preferences';
import { useFeatureFlag, useMatchMedia, usePermissions } from '../hooks';

import AddReport, { STORAGE_KEY as ADD_BUTTON_STORAGE_KEY } from '../AddReport';
import AnalyzerLayerList from '../AnalyzerLayerList';
import BadgeIcon from '../Badge';
import ClearAllControl from '../ClearAllControl';
import ErrorBoundary from '../ErrorBoundary';
import FeatureLayerList from '../FeatureLayerList';
import MapLayerFilter from '../MapLayerFilter';
import ReportMapControl from '../ReportMapControl';
import SubjectGroupList from '../SubjectGroupList';

import PatrolsTab from './PatrolsTab';
import ReportsTab from './ReportsTab';

import { ReactComponent as ChevronIcon } from '../common/images/icons/chevron.svg';
import { ReactComponent as CrossIcon } from '../common/images/icons/cross.svg';
import { ReactComponent as DocumentIcon } from '../common/images/icons/document.svg';
import { ReactComponent as LayersIcon } from '../common/images/icons/layers.svg';
import { ReactComponent as PatrolIcon } from '../common/images/icons/patrol.svg';
import { ReactComponent as ArrowLeftIcon } from '../common/images/icons/arrow-left.svg';

import styles from './styles.module.scss';

const { ENABLE_UFA_NAVIGATION_UI } = DEVELOPMENT_FEATURE_FLAGS;

/* --- OLD NAVIGATION STUFF STARTS HERE --- */
const PatrolsTabOld = lazy(() => import('./PatrolsTab'));

const drawerTracker = trackEventFactory(DRAWER_CATEGORY);

const SET_TAB = 'SET_TAB';
const SIDEBAR_STATE_REDUCER_NAMESPACE = 'SIDEBAR_TAB';

const { screenIsMediumLayoutOrLarger, screenIsExtraLargeWidth } = BREAKPOINTS;

const setActiveTab = (tab) => ({ type: SET_TAB, payload: tab });

const activeTabReducer = (state = TAB_KEYS.REPORTS, action) => {
  if (action.type === SET_TAB) {
    return action.payload;
  }
  return state;
};
/* --- OLD NAVIGATION STUFF ENDS HERE --- */

const VALID_ADD_REPORT_TYPES = [TAB_KEYS.REPORTS, TAB_KEYS.PATROLS];

const SideBar = ({ map, onHandleClick }) => {
  const dispatch = useDispatch();

  const patrolFilter = useSelector((state) => state.data.patrolFilter);
  const patrols = useSelector((state) => getPatrolList(state));
  const sideBar = useSelector((state) => state.view.sideBar);
  const sidebarOpen = useSelector((state) => state.view.userPreferences.sidebarOpen);

  const patrolFlagEnabled = useFeatureFlag(FEATURE_FLAGS.PATROL_MANAGEMENT);
  const hasPatrolViewPermissions = usePermissions(PERMISSION_KEYS.PATROLS, PERMISSIONS.READ);

  const socket = useContext(SocketContext);

  const patrolFetchRef = useRef(null);

  const [loadingPatrols, setPatrolLoadState] = useState(false);
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
    switch (sideBar.currentTab) {
    case TAB_KEYS.REPORTS:
      return 'Reports';
    case TAB_KEYS.PATROLS:
      return 'Patrols';
    case TAB_KEYS.LAYERS:
      return 'Map Layers';
    default:
      return '';
    }
  }, [sideBar.currentTab]);

  const fetchAndLoadPatrolData = useCallback(() => {
    patrolFetchRef.current = dispatch(fetchPatrols());

    patrolFetchRef.current.request
      .finally(() => {
        setPatrolLoadState(false);
        patrolFetchRef.current = null;
      });

  }, [dispatch]);

  const onSelectTab = useCallback((clickedSidebarTab) => {
    if (clickedSidebarTab === sideBar.currentTab && sidebarOpen) {
      dispatch(updateUserPreferences({ sidebarOpen: false }));
    } else {
      dispatch(openTab(clickedSidebarTab));
    }
  }, [dispatch, sidebarOpen, sideBar.currentTab]);

  const handleCloseSideBar = useCallback(() => {
    dispatch(updateUserPreferences({ sidebarOpen: false }));
  }, [dispatch]);

  const onClickBackFromDetailView = useCallback(() => {
    dispatch(hideDetailView());
  }, [dispatch]);

  useEffect(() => {
    if (showEventsBadge && sidebarOpen && sideBar.currentTab === TAB_KEYS.REPORTS) {
      setShowEventsBadge(false);
    }
  }, [showEventsBadge, sidebarOpen, sideBar.currentTab]);

  useEffect(() => {
    if (socket) {
      const updateEventsBadge = ({ matches_current_filter }) => {
        if (matches_current_filter && (sideBar.currentTab !== TAB_KEYS.REPORTS || !sidebarOpen)) {
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
  }, [sidebarOpen, sideBar.currentTab, socket]);

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
    if (ENABLE_UFA_NAVIGATION_UI && VALID_ADD_REPORT_TYPES.includes(sideBar.currentTab)) {
      window.localStorage.setItem(ADD_BUTTON_STORAGE_KEY, sideBar.currentTab);
    }
  }, [sideBar.currentTab]);

  /* --- OLD NAVIGATION STUFF STARTS HERE --- */
  const eventFilter = useSelector((state) => state.data.eventFilter);

  const activeTabPreClose = useRef(null);

  const [activeTab, dispatchOld] = useReducer(
    undoable(activeTabReducer, SIDEBAR_STATE_REDUCER_NAMESPACE),
    calcInitialUndoableState(activeTabReducer)
  );

  const { filter: { overlap } } = patrolFilter;

  const isExtraLargeLayout = useMatchMedia(screenIsExtraLargeWidth);
  const isMediumLayout = useMatchMedia(screenIsMediumLayoutOrLarger);

  const onTabsSelect = (eventKey) => {
    dispatchOld(setActiveTab(eventKey));
    let tabTitles = {
      [TAB_KEYS.REPORTS]: 'Reports',
      [TAB_KEYS.LAYERS]: 'Map Layers',
      [TAB_KEYS.PATROLS]: 'Patrols',
    };
    drawerTracker.track(`Click '${tabTitles[eventKey]}' tab`);
  };

  useEffect(() => {
    if (!ENABLE_UFA_NAVIGATION_UI && VALID_ADD_REPORT_TYPES.includes(activeTab.current)) {
      window.localStorage.setItem(ADD_BUTTON_STORAGE_KEY, activeTab.current);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!ENABLE_UFA_NAVIGATION_UI && !isEqual(eventFilter, INITIAL_FILTER_STATE)) {
      fetchAndLoadPatrolData();
    }
  }, [overlap]); // eslint-disable-line

  useEffect(() => {
    if (!ENABLE_UFA_NAVIGATION_UI && !isUndefined(sidebarOpen)) {
      if (!sidebarOpen) {
        activeTabPreClose.current = activeTab.current;
        dispatchOld(setActiveTab(TAB_KEYS.REPORTS));
      } else {
        if (activeTabPreClose.current !== TAB_KEYS.REPORTS) {
          dispatchOld(undo(SIDEBAR_STATE_REDUCER_NAMESPACE));
        }
      }
    }
  }, [sidebarOpen]); /* eslint-disable-line react-hooks/exhaustive-deps */

  const addReportPopoverPlacement = isExtraLargeLayout
    ? 'left'
    : (isMediumLayout
      ? sidebarOpen
        ? 'auto'
        : 'left'
      : 'auto'
    );

  if (!ENABLE_UFA_NAVIGATION_UI && !map) return null;

  const selectedTab = !!activeTab && activeTab.current;

  if (!ENABLE_UFA_NAVIGATION_UI)  {
    return <ErrorBoundary>
      <MapContext.Provider value={map}>
        <aside className={`${'side-menu'} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
          <button onClick={onHandleClick} className="handle" type="button"><span><ChevronIcon /></span></button>
          {activeTab.current !== TAB_KEYS.LAYERS && <div className={styles.addReportContainer}>
            <AddReport popoverPlacement={addReportPopoverPlacement} showLabel={false} type={activeTab.current} />
          </div>}
          <Tabs activeKey={selectedTab} onSelect={onTabsSelect} className={styles.tabBar}>
            <Tab className={styles.oldNavigationTab} eventKey={TAB_KEYS.REPORTS} title="Reports">
              <ReportsTab map={map} sidebarOpen={sidebarOpen}/>
            </Tab>

            {showPatrols && <Tab className={styles.oldNavigationTab} eventKey={TAB_KEYS.PATROLS} title="Patrols">
              <Suspense fallback={null}>
                <PatrolsTabOld loadingPatrols={loadingPatrols} map={map} patrolResults={patrols.results} />
              </Suspense>
            </Tab>}

            <Tab className={styles.oldNavigationTab} eventKey={TAB_KEYS.LAYERS} title="Map Layers">
              <ErrorBoundary>
                <MapLayerFilter />
                <div className={styles.oldNavigationMapLayers}>
                  <ReportMapControl/>
                  <SubjectGroupList map={map} />
                  <FeatureLayerList map={map} />
                  <AnalyzerLayerList map={map} />
                  <div className={styles.noItems}>No items to display.</div>
                </div>
                <div className={styles.mapLayerFooter}>
                  <ClearAllControl map={map} />
                </div>
              </ErrorBoundary>
            </Tab>
          </Tabs>
        </aside>
      </MapContext.Provider>
    </ErrorBoundary>;
  }
  /* --- OLD NAVIGATION STUFF ENDS HERE --- */

  return <ErrorBoundary>
    <aside className={styles.sideBar}>
      <Tab.Container activeKey={sideBar.currentTab} onSelect={onSelectTab}>
        <Nav className={`${styles.verticalNav} ${sidebarOpen ? 'open' : ''}`}>
          <Nav.Item>
            <Nav.Link eventKey={TAB_KEYS.REPORTS}>
              <DocumentIcon />
              {!!showEventsBadge && <BadgeIcon className={styles.badge} />}
              <span>Reports</span>
            </Nav.Link>
          </Nav.Item>

          {showPatrols && <Nav.Item>
            <Nav.Link eventKey={TAB_KEYS.PATROLS}>
              <PatrolIcon />
              <span>Patrols</span>
            </Nav.Link>
          </Nav.Item>}

          <Nav.Item>
            <Nav.Link eventKey={TAB_KEYS.LAYERS}>
              <LayersIcon />
              <span>Map Layers</span>
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <div className={`${styles.tabsContainer} ${sidebarOpen ? 'open' : ''}`}>
          <Tab.Content className={`${styles.tab} ${sidebarOpen ? 'open' : ''}`}>
            <div className={styles.header}>
              <div
                className={sideBar.currentTab === TAB_KEYS.LAYERS ? 'hidden' : ''}
                data-testid="sideBar-addReportButton"
              >
                {sideBar.showDetailView ?
                  <button className={styles.backButton} type='button' onClick={onClickBackFromDetailView} data-testid="sideBar-backDetailViewButton">
                    <ArrowLeftIcon />
                  </button>
                  :
                  <AddReport
                    className={styles.addReport}
                    variant="secondary"
                    formProps={{ hidePatrols: sideBar.currentTab !== TAB_KEYS.PATROLS }}
                    hideReports={sideBar.currentTab !== TAB_KEYS.REPORTS}
                    popoverPlacement="bottom"
                    showLabel={false}
                    type={sideBar.currentTab}
                  />
                }
              </div>

              <h3>{tabTitle}</h3>

              <button
                data-testid="sideBar-closeButton"
                onClick={handleCloseSideBar}
              >
                <CrossIcon />
              </button>
            </div>

            <Tab.Pane className={styles.tabBody} eventKey={TAB_KEYS.REPORTS}>
              <ReportsTab map={map} sidebarOpen={sidebarOpen} className={styles.reportsTab}/>
            </Tab.Pane>

            {showPatrols && <Tab.Pane className={styles.tabBody} eventKey={TAB_KEYS.PATROLS}>
              <PatrolsTab loadingPatrols={loadingPatrols} map={map} patrolResults={patrols.results} />
            </Tab.Pane>}

            <Tab.Pane className={styles.tabBody} eventKey={TAB_KEYS.LAYERS}>
              <ErrorBoundary>
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
              </ErrorBoundary>
            </Tab.Pane>
          </Tab.Content>
        </div>
      </Tab.Container>
    </aside>
  </ErrorBoundary>;
};

SideBar.propTypes = { map: PropTypes.object.isRequired };

export default memo(SideBar);
