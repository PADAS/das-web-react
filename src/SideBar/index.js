import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cloneDeep } from 'lodash-es';
import Nav from 'react-bootstrap/Nav';
import PropTypes from 'prop-types';
import Tab from 'react-bootstrap/Tab';
import { useDispatch, useSelector } from 'react-redux';

import { FEATURE_FLAGS, PERMISSION_KEYS, PERMISSIONS, TAB_KEYS } from '../constants';
import { fetchPatrols } from '../ducks/patrols';
import { getPatrolList } from '../selectors/patrols';
import { updateUserPreferences } from '../ducks/user-preferences';
import { useFeatureFlag, usePermissions } from '../hooks';

import AddReport, { STORAGE_KEY as ADD_BUTTON_STORAGE_KEY } from '../AddReport';
import AnalyzerLayerList from '../AnalyzerLayerList';
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

import styles from './styles.module.scss';

const VALID_ADD_REPORT_TYPES = [TAB_KEYS.REPORTS, TAB_KEYS.PATROLS];

const SideBar = ({ map }) => {
  const dispatch = useDispatch();

  const patrolFilter = useSelector((state) => state.data.patrolFilter);
  const patrols = useSelector((state) => getPatrolList(state));
  const sidebarOpen = useSelector((state) => state.view.userPreferences.sidebarOpen);
  const sidebarTab = useSelector((state) => state.view.userPreferences.sidebarTab);

  const patrolFlagEnabled = useFeatureFlag(FEATURE_FLAGS.PATROL_MANAGEMENT);
  const hasPatrolViewPermissions = usePermissions(PERMISSION_KEYS.PATROLS, PERMISSIONS.READ);

  const patrolFetchRef = useRef(null);

  const [loadingPatrols, setPatrolLoadState] = useState(false);

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
    switch (sidebarTab) {
    case TAB_KEYS.REPORTS:
      return 'Reports';
    case TAB_KEYS.PATROLS:
      return 'Patrols';
    case TAB_KEYS.LAYERS:
      return 'Map Layers';
    default:
      return '';
    }
  }, [sidebarTab]);

  const fetchAndLoadPatrolData = useCallback(() => {
    patrolFetchRef.current = dispatch(fetchPatrols());

    patrolFetchRef.current.request
      .finally(() => {
        setPatrolLoadState(false);
        patrolFetchRef.current = null;
      });

  }, [dispatch]);

  const onSelectTab = useCallback((clickedSidebarTab) => {
    if (clickedSidebarTab === sidebarTab && sidebarOpen) {
      dispatch(updateUserPreferences({ sidebarOpen: false, sidebarTab: clickedSidebarTab }));
    } else {
      dispatch(updateUserPreferences({ sidebarOpen: true, sidebarTab: clickedSidebarTab }));
    }
  }, [dispatch, sidebarOpen, sidebarTab]);

  // fetch patrols if filter itself has changed
  useEffect(() => {
    setPatrolLoadState(true);
    fetchAndLoadPatrolData();
    return () => {
      const priorRequestCancelToken = patrolFetchRef?.current?.cancelToken;

      if (priorRequestCancelToken) {
        priorRequestCancelToken.cancel();
      }
    };
  }, [fetchAndLoadPatrolData, patrolFilterParams]);

  useEffect(() => {
    if (VALID_ADD_REPORT_TYPES.includes(sidebarTab)) {
      window.localStorage.setItem(ADD_BUTTON_STORAGE_KEY, sidebarTab);
    }
  }, [sidebarTab]);

  return <ErrorBoundary>
    <aside className={styles.sideBar}>
      <Tab.Container activeKey={sidebarTab} onSelect={onSelectTab}>
        <Nav className={`${styles.verticalNav} ${sidebarOpen ? 'open' : ''}`}>
          <Nav.Item>
            <Nav.Link eventKey={TAB_KEYS.REPORTS}>
              <DocumentIcon />
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
              <div className={sidebarTab === TAB_KEYS.LAYERS ? 'hidden' : ''} data-testid="sideBar-addReportButton">
                <AddReport popoverPlacement="bottom" showLabel={false} type={sidebarTab} />
              </div>

              <h3>{tabTitle}</h3>

              <button
                data-testid="sideBar-closeButton"
                onClick={() => dispatch(updateUserPreferences({ sidebarOpen: false }))}
              >
                <CrossIcon />
              </button>
            </div>

            <Tab.Pane className={styles.tabBody} eventKey={TAB_KEYS.REPORTS}>
              <ReportsTab map={map} sidebarOpen={sidebarOpen} />
            </Tab.Pane>

            <Tab.Pane className={styles.tabBody} eventKey={TAB_KEYS.PATROLS}>
              <PatrolsTab loadingPatrols={loadingPatrols} map={map} patrolResults={patrols.results} />
            </Tab.Pane>

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
