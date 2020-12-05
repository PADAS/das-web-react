import React, { useCallback, useEffect, useMemo, useState, memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import Button from 'react-bootstrap/Button';
import isEqual from 'react-fast-compare';
import uniq from 'lodash/uniq';

import { BREAKPOINTS, FEATURE_FLAGS } from '../constants';
import { useMatchMedia, useFeatureFlag } from '../hooks';

import { openModalForReport, calcEventFilterForRequest } from '../utils/events';
import { getFeedEvents } from '../selectors';
import { patrolListFromStore } from '../selectors/patrols';
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

import styles from './styles.module.scss';

import { ReactComponent as RefreshIcon } from '../common/images/icons/refresh-icon.svg';
import ClearAllControl from '../ClearAllControl';
import ReportMapControl from '../ReportMapControl';
import ErrorBoundary from '../ErrorBoundary';
import FriendlyEventFilterString from '../EventFilter/FriendlyEventFilterString';
import ErrorMessage from '../ErrorMessage';
import PatrolList from '../PatrolList';
import TotalReportCountString from '../EventFilter/TotalReportCountString';

const TAB_KEYS = {
  REPORTS: 'reports',
  LAYERS: 'layers',
  PATROLS: 'patrols',
};

const { screenIsMediumLayoutOrLarger, screenIsExtraLargeWidth } = BREAKPOINTS;

const SideBar = (props) => {
  const { events, patrols, eventFilter, patrolFilter, fetchEventFeed, fetchPatrols, fetchNextEventFeedPage, map, onHandleClick, reportHeatmapVisible, setReportHeatmapVisibility, sidebarOpen } = props;

  const [loadingEvents, setEventLoadState] = useState(false);
  const [feedEvents, setFeedEvents] = useState([]);
  const [activeTab, setActiveTab] = useState(TAB_KEYS.REPORTS);

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
    setActiveTab(eventKey);
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

  useEffect(() => {
    if (showPatrols) {
      fetchPatrols();
    }
  }, [patrolFilter]); // eslint-disable-line

  useEffect(() => {
    if (!sidebarOpen) {
      setActiveTab(TAB_KEYS.REPORTS);
    }
  }, [sidebarOpen]);

  const isExtraLargeLayout = useMatchMedia(screenIsExtraLargeWidth);
  const isMediumLayout = useMatchMedia(screenIsMediumLayoutOrLarger);

  const showPatrols = useFeatureFlag(FEATURE_FLAGS.PATROL_MANAGEMENT);

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

  if (!map) return null;

  return <ErrorBoundary>
    <aside className={`${'side-menu'} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
      <button onClick={onHandleClick} className="handle" type="button"><span><ChevronIcon /></span></button>
      <div className={styles.addReportContainer}>
        <AddReport popoverPlacement={addReportPopoverPlacement} map={map} showLabel={false} />
      </div>
      <Tabs activeKey={activeTab} onSelect={onTabsSelect} className={styles.tabBar}>
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
          <PatrolList map={map} patrols={patrols.results || []}/>
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
  </ErrorBoundary>;
};

const mapStateToProps = (state) => ({
  events: getFeedEvents(state),
  eventFilter: state.data.eventFilter,
  patrols: patrolListFromStore(state),
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