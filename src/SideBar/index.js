import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState, memo } from 'react';
import { MapContext } from 'react-mapbox-gl';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import isEqual from 'react-fast-compare';
import isUndefined from 'lodash/isUndefined';

import { BREAKPOINTS, FEATURE_FLAGS, PERMISSION_KEYS, PERMISSIONS, TAB_KEYS } from '../constants';
import { useMatchMedia, useFeatureFlag, usePermissions } from '../hooks';

import { getPatrolList } from '../selectors/patrols';
import { ReactComponent as ChevronIcon } from '../common/images/icons/chevron.svg';

import { fetchPatrols } from '../ducks/patrols';
import { INITIAL_FILTER_STATE } from '../ducks/event-filter';
import SubjectGroupList from '../SubjectGroupList';
import FeatureLayerList from '../FeatureLayerList';
import AnalyzerLayerList from '../AnalyzerLayerList';
import AddReport, { STORAGE_KEY as ADD_BUTTON_STORAGE_KEY } from '../AddReport';
import EventFilter from '../EventFilter';
import MapLayerFilter from '../MapLayerFilter';
import PatrolFilter from '../PatrolFilter';

import { trackEvent } from '../utils/analytics';
import undoable, { calcInitialUndoableState, undo } from '../reducers/undoable';

import ReportsTab from './ReportsTab';
import styles from './styles.module.scss';

import ClearAllControl from '../ClearAllControl';
import ReportMapControl from '../ReportMapControl';
import ErrorBoundary from '../ErrorBoundary';
import PatrolList from '../PatrolList';
import { cloneDeep } from 'lodash-es';

const SET_TAB = 'SET_TAB';

const setActiveTab = (tab) => {
  return {
    type: 'SET_TAB',
    payload: tab,
  };
};

const SIDEBAR_STATE_REDUCER_NAMESPACE = 'SIDEBAR_TAB';

const activeTabReducer = (state = TAB_KEYS.REPORTS, action) => {
  if (action.type === SET_TAB) {
    return action.payload;
  }
  return state;
};

const validAddReportTypes = [TAB_KEYS.REPORTS, TAB_KEYS.PATROLS];

const { screenIsMediumLayoutOrLarger, screenIsExtraLargeWidth } = BREAKPOINTS;

const SideBar = (props) => {
  const { patrols, eventFilter, patrolFilter, fetchPatrols, map, onHandleClick, sidebarOpen } = props;

  const { filter: { overlap } } = patrolFilter;

  const [loadingPatrols, setPatrolLoadState] = useState(false);
  const [activeTab, dispatch] = useReducer(undoable(activeTabReducer, SIDEBAR_STATE_REDUCER_NAMESPACE), calcInitialUndoableState(activeTabReducer));

  const patrolFilterParams = useMemo(() => {
    const filterParams = cloneDeep(patrolFilter);
    delete filterParams.filter.overlap;
    return filterParams;
  }, [patrolFilter]);

  const activeTabPreClose = useRef(null);
  const patrolFetchRef = useRef(null);

  useEffect(() => {
    if (validAddReportTypes.includes(activeTab.current)) {
      window.localStorage.setItem(ADD_BUTTON_STORAGE_KEY, activeTab.current);
    }
  }, [activeTab]);

  const onTabsSelect = (eventKey) => {
    dispatch(setActiveTab(eventKey));
    let tabTitles = {
      [TAB_KEYS.REPORTS]: 'Reports',
      [TAB_KEYS.LAYERS]: 'Map Layers',
      [TAB_KEYS.PATROLS]: 'Patrols',
    };
    trackEvent('Drawer', `Click '${tabTitles[eventKey]}' tab`);
  };

  // fetch patrols if filter settings has changed
  useEffect(() => {
    if (!isEqual(eventFilter, INITIAL_FILTER_STATE)) {
      fetchAndLoadPatrolData();
    }
  }, [overlap]); // eslint-disable-line

  useEffect(() => {
    if (!isUndefined(sidebarOpen)) {
      if (!sidebarOpen) {
        activeTabPreClose.current = activeTab.current;
        dispatch(setActiveTab(TAB_KEYS.REPORTS));
      } else {
        if (activeTabPreClose.current !== TAB_KEYS.REPORTS) {
          dispatch(undo(SIDEBAR_STATE_REDUCER_NAMESPACE));
        }
      }
    }
  }, [sidebarOpen]); /* eslint-disable-line react-hooks/exhaustive-deps */

  const isExtraLargeLayout = useMatchMedia(screenIsExtraLargeWidth);
  const isMediumLayout = useMatchMedia(screenIsMediumLayoutOrLarger);

  const patrolFlagEnabled = useFeatureFlag(FEATURE_FLAGS.PATROL_MANAGEMENT);
  const hasPatrolViewPermissions = usePermissions(PERMISSION_KEYS.PATROLS, PERMISSIONS.READ);

  const showPatrols = !!patrolFlagEnabled && !!hasPatrolViewPermissions;

  const fetchAndLoadPatrolData = useCallback(() => {
    patrolFetchRef.current = fetchPatrols();

    patrolFetchRef.current.request
      .finally(() => {
        setPatrolLoadState(false);
        patrolFetchRef.current = null;
      });

  }, [fetchPatrols]);

  const addReportPopoverPlacement = isExtraLargeLayout
    ? 'left'
    : (isMediumLayout
      ? sidebarOpen
        ? 'auto'
        : 'left'
      : 'auto'
    );

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

  if (!map) return null;

  const selectedTab = !!activeTab && activeTab.current;

  return <ErrorBoundary>
    <MapContext.Provider value={map}>
      <aside className={`${'side-menu'} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <button onClick={onHandleClick} className="handle" type="button"><span><ChevronIcon /></span></button>
        {activeTab.current !== TAB_KEYS.LAYERS && <div className={styles.addReportContainer}>
          <AddReport popoverPlacement={addReportPopoverPlacement} map={map} showLabel={false} type={activeTab.current} />
        </div>}
        <Tabs activeKey={selectedTab} onSelect={onTabsSelect} className={styles.tabBar}>
          <Tab className={styles.tab} eventKey={TAB_KEYS.REPORTS} title="Reports">
            <ReportsTab map={map} sidebarOpen={sidebarOpen}/>
          </Tab>

          {showPatrols && <Tab className={styles.tab} eventKey={TAB_KEYS.PATROLS} title="Patrols">
            <PatrolFilter />
            <PatrolList map={map} patrols={patrols.results} loading={loadingPatrols}/>
          </Tab>}

          <Tab className={styles.tab} eventKey={TAB_KEYS.LAYERS} title="Map Layers">
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
          </Tab>
        </Tabs>
      </aside>
    </MapContext.Provider>
  </ErrorBoundary>;
};

const mapStateToProps = (state) => ({
  eventFilter: state.data.eventFilter,
  patrols: getPatrolList(state),
  patrolFilter: state.data.patrolFilter,
  sidebarOpen: state.view.userPreferences.sidebarOpen,
});

export default connect(mapStateToProps, { fetchPatrols })(memo(SideBar));

SideBar.propTypes = {
  eventFilter: PropTypes.object.isRequired,
  onHandleClick: PropTypes.func.isRequired,
  map: PropTypes.object,
};