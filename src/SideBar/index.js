import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState, memo } from 'react';
import { MapContext } from 'react-mapbox-gl';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import Button from 'react-bootstrap/Button';
import isEqual from 'react-fast-compare';
import uniq from 'lodash/uniq';
import isUndefined from 'lodash/isUndefined';

import { BREAKPOINTS, FEATURE_FLAGS, PERMISSION_KEYS, PERMISSIONS } from '../constants';
import { useMatchMedia, useFeatureFlag, usePermissions, useDeepCompareEffect } from '../hooks';

import { openModalForReport, calcEventFilterForRequest } from '../utils/events';
import { getFeedEvents } from '../selectors';
import { getPatrolList } from '../selectors/patrols';
import { ReactComponent as ChevronIcon } from '../common/images/icons/chevron.svg';

import { fetchEventFeed, fetchNextEventFeedPage } from '../ducks/events';
import { fetchPatrols } from '../ducks/patrols';
import { INITIAL_FILTER_STATE } from '../ducks/event-filter';
import { setReportHeatmapVisibility } from '../ducks/map-ui';
import SubjectGroupList from '../SubjectGroupList';
import FeatureLayerList from '../FeatureLayerList';
import AnalyzerLayerList from '../AnalyzerLayerList';
import EventFeed from '../EventFeed';
import AddReport from '../AddReport';
import EventFilter from '../EventFilter';
import MapLayerFilter from '../MapLayerFilter';
import PatrolFilter from '../PatrolFilter';
import HeatmapToggleButton from '../HeatmapToggleButton';
import DelayedUnmount from '../DelayedUnmount';
import SleepDetector from '../SleepDetector';
import { trackEvent } from '../utils/analytics';
import undoable, { calcInitialUndoableState, undo } from '../reducers/undoable';

import styles from './styles.module.scss';

import { ReactComponent as RefreshIcon } from '../common/images/icons/refresh-icon.svg';
import ClearAllControl from '../ClearAllControl';
import ReportMapControl from '../ReportMapControl';
import ErrorBoundary from '../ErrorBoundary';
import FriendlyEventFilterString from '../EventFilter/FriendlyEventFilterString';
import ErrorMessage from '../ErrorMessage';
import PatrolList from '../PatrolList';
import TotalReportCountString from '../EventFilter/TotalReportCountString';
import { cloneDeep } from 'lodash-es';

const TAB_KEYS = {
  REPORTS: 'reports',
  LAYERS: 'layers',
  PATROLS: 'patrols',
};

const SET_TAB = 'SET_TAB';

const setActiveTab = (tab) => ({
  type: 'SET_TAB',
  payload: tab,
});

const SIDEBAR_STATE_REDUCER_NAMESPACE = 'SIDEBAR_TAB';

const activeTabReducer = (state = TAB_KEYS.REPORTS, action) => {
  if (action.type === SET_TAB) {
    return action.payload;
  }
  return state;
};

const { screenIsMediumLayoutOrLarger, screenIsExtraLargeWidth } = BREAKPOINTS;

const SideBar = (props) => {
  const { events, patrols, eventFilter, patrolFilter, fetchEventFeed, fetchPatrols, fetchNextEventFeedPage, map, onHandleClick, reportHeatmapVisible, setReportHeatmapVisibility, sidebarOpen } = props;
  const { filter: { overlap } } = patrolFilter;

  const [loadingEvents, setEventLoadState] = useState(false);
  const [loadingPatrols, setPatrolLoadState] = useState(false);
  const [feedEvents, setFeedEvents] = useState([]);
  const [activeTab, dispatch] = useReducer(undoable(activeTabReducer, SIDEBAR_STATE_REDUCER_NAMESPACE), calcInitialUndoableState(activeTabReducer));

  const onScroll = () => fetchNextEventFeedPage(events.next);

  const toggleReportHeatmapVisibility = () => {
    setReportHeatmapVisibility(!reportHeatmapVisible);
    trackEvent('Reports', `${reportHeatmapVisible ? 'Hide' : 'Show'} Reports Heatmap`);
  };

  const optionalFeedProps = useMemo(() => {
    let value = {};
    if (isEqual(eventFilter, INITIAL_FILTER_STATE)) {
      value.exclude_contained = true; /* consolidate reports into their parent incidents if the feed is in a 'default' state, but include them in results if users are searching/filtering for something */
    }
    return value;
  }, [eventFilter]);

  const patrolFilterParams = useMemo(() => {
    const filterParams = cloneDeep(patrolFilter);
    delete filterParams.filter.overlap;
    return filterParams;
  }, [patrolFilter]);
    
  const activeTabPreClose = useRef(null);

  useEffect(() => {
    if (!optionalFeedProps.exclude_contained) { 
      setFeedEvents(events.results);
    }
    else {  
      /* guard code against new events being pushed into the feed despite not matching the exclude_contained filter. 
      this happens as relationships can be established outside the state awareness of the feed. */
      const containedEventIdsToRemove = uniq(events.results
        .filter(({ is_collection }) => !!is_collection)
        .reduce((accumulator, item) => [
          ...accumulator,
          ...item.contains.map(({ related_event: { id } }) => id),
        ], []));
      setFeedEvents(events.results.filter(event => !containedEventIdsToRemove.includes(event.id)));
    }
  }, [events.results, optionalFeedProps.exclude_contained]);

  const onEventTitleClick = (event) => {
    openModalForReport(event, map);
    trackEvent('Feed', `Open ${event.is_collection ? 'Incident' : 'Event'} Report`, `Event Type:${event.event_type}`);
  };

  const onTabsSelect = (eventKey) => {
    dispatch(setActiveTab(eventKey));
    let tabTitles = {
      [TAB_KEYS.REPORTS]: 'Reports',
      [TAB_KEYS.LAYERS]: 'Map Layers',
      [TAB_KEYS.PATROLS]: 'Patrols',
    };
    trackEvent('Drawer', `Click '${tabTitles[eventKey]}' tab`);
  };

  const loadFeedEvents = useCallback(() => {
    setEventLoadState(true);
    return fetchEventFeed({}, calcEventFilterForRequest({ params: optionalFeedProps }))
      .then(() => {
        setEventLoadState(false);
      });
  }, [fetchEventFeed, optionalFeedProps]);

  useEffect(() => {
    loadFeedEvents();
  }, [eventFilter]); // eslint-disable-line

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
        if ( activeTabPreClose.current !== TAB_KEYS.REPORTS) {
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

  const fetchAndLoadPatrolData = useCallback(async() => {
    setPatrolLoadState(true);
    await fetchPatrols();
    setPatrolLoadState(false);
  }, [fetchPatrols]);

  const addReportPopoverPlacement = isExtraLargeLayout
    ? 'left'
    : (isMediumLayout
      ? sidebarOpen
        ? 'auto'
        : 'left'
      : 'auto'
    );

  useEffect(() => {
    if (loadingEvents && events.error) {
      setEventLoadState(false);
    }
  }, [events.error, loadingEvents]);

  // fetch patrols if filter itself has changed
  useDeepCompareEffect(() => {
    fetchAndLoadPatrolData();
  }, [fetchAndLoadPatrolData, patrolFilterParams]);

  if (!map) return null;

  const selectedTab = !!activeTab && activeTab.current;

  return <ErrorBoundary>
    <MapContext.Provider value={map}>
      <aside className={`${'side-menu'} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <button onClick={onHandleClick} className="handle" type="button"><span><ChevronIcon /></span></button>
        <div className={styles.addReportContainer}>
          <AddReport popoverPlacement={addReportPopoverPlacement} map={map} showLabel={false} />
        </div>
        <Tabs activeKey={selectedTab} onSelect={onTabsSelect} className={styles.tabBar}>
          <Tab className={styles.tab} eventKey={TAB_KEYS.REPORTS} title="Reports">
            <DelayedUnmount isMounted={sidebarOpen}>
              <ErrorBoundary>
                <div className={styles.filterWrapper}>
                  <EventFilter className={styles.eventFilter}>
                    <HeatmapToggleButton className={styles.heatmapButton} onButtonClick={toggleReportHeatmapVisibility} showLabel={false} heatmapVisible={reportHeatmapVisible} />
                  </EventFilter>
                  <div className={styles.filterStringWrapper}>
                    <FriendlyEventFilterString className={styles.friendlyFilterString} />
                    <TotalReportCountString className={styles.totalReportCountString} totalFeedEventCount={events.count} />
                  </div>
                </div>
              </ErrorBoundary>
            </DelayedUnmount>
            <ErrorBoundary>
              {!!events.error && <div className={styles.feedError}>
                <ErrorMessage message='Could not load reports. Please try again.' details={events.error} />
                <Button type='button' variant='primary' onClick={loadFeedEvents}>
                  <RefreshIcon />
                Try again
                </Button>
              </div>}
              {!events.error && <EventFeed
                className={styles.sidebarEventFeed}
                hasMore={!!events.next}
                map={map}
                loading={loadingEvents}
                events={feedEvents}
                onScroll={onScroll}
                onTitleClick={onEventTitleClick}
              />
              }
            </ErrorBoundary>
          </Tab>
          {showPatrols && <Tab className={styles.tab} eventKey={TAB_KEYS.PATROLS} title="Patrols">
            <PatrolFilter className={styles.patrolFilter} /> 
            <PatrolList map={map} patrols={patrols.results} loading={loadingPatrols}/>
          </Tab>}
          <Tab className={styles.tab} eventKey={TAB_KEYS.LAYERS} title="Map Layers">
            <ErrorBoundary>
              <MapLayerFilter />
              <div className={styles.mapLayers}>
                <ReportMapControl />
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
      <SleepDetector onSleepDetected={loadFeedEvents} />
    </MapContext.Provider>
  </ErrorBoundary>;
};

const mapStateToProps = (state) => ({
  events: getFeedEvents(state),
  eventFilter: state.data.eventFilter,
  patrols: getPatrolList(state),
  patrolFilter: state.data.patrolFilter,
  sidebarOpen: state.view.userPreferences.sidebarOpen,
  reportHeatmapVisible: state.view.showReportHeatmap,
});

export default connect(mapStateToProps, { fetchEventFeed, fetchNextEventFeedPage, fetchPatrols, setReportHeatmapVisibility })(memo(SideBar));

SideBar.propTypes = {
  events: PropTypes.shape({
    count: PropTypes.number,
    next: PropTypes.string,
    previous: PropTypes.string,
    results: PropTypes.array,
  }).isRequired,
  eventFilter: PropTypes.object.isRequired,
  onHandleClick: PropTypes.func.isRequired,
  fetchEventFeed: PropTypes.func.isRequired,
  fetchNextEventFeedPage: PropTypes.func.isRequired,
  map: PropTypes.object,
};