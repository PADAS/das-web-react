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
import Nav from 'react-bootstrap/Nav';
import PropTypes from 'prop-types';
import Tab from 'react-bootstrap/Tab';
import { useDispatch, useSelector } from 'react-redux';

import {
  FEATURE_FLAGS,
  PERMISSION_KEYS,
  PERMISSIONS,
  TAB_KEYS,
} from '../constants';
import { fetchPatrols } from '../ducks/patrols';
import { getPatrolList } from '../selectors/patrols';
import { hideDetailView, openTab } from '../ducks/side-bar';
import { SocketContext } from '../withSocketConnection';
import { updateUserPreferences } from '../ducks/user-preferences';
import { useFeatureFlag, usePermissions } from '../hooks';

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

import { ReactComponent as CrossIcon } from '../common/images/icons/cross.svg';
import { ReactComponent as DocumentIcon } from '../common/images/icons/document.svg';
import { ReactComponent as LayersIcon } from '../common/images/icons/layers.svg';
import { ReactComponent as PatrolIcon } from '../common/images/icons/patrol.svg';
import { ReactComponent as ArrowLeftIcon } from '../common/images/icons/arrow-left.svg';

import styles from './styles.module.scss';

const VALID_ADD_REPORT_TYPES = [TAB_KEYS.REPORTS, TAB_KEYS.PATROLS];

const SideBar = ({ map }) => {
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
    if (VALID_ADD_REPORT_TYPES.includes(sideBar.currentTab)) {
      window.localStorage.setItem(ADD_BUTTON_STORAGE_KEY, sideBar.currentTab);
    }
  }, [sideBar.currentTab]);

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
