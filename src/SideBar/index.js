import React, { useEffect, useState, useRef, memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import Button from 'react-bootstrap/Button';

import { openModalForReport, calcEventFilterForRequest } from '../utils/events';
import { getFeedEvents } from '../selectors';
import { ReactComponent as ChevronIcon } from '../common/images/icons/chevron.svg';

import { fetchEventFeed, fetchNextEventFeedPage } from '../ducks/events';
import { setReportHeatmapVisibility } from '../ducks/map-ui';
import SubjectGroupList from '../SubjectGroupList';
import FeatureLayerList from '../FeatureLayerList';
import EventFeed from '../EventFeed';
import AddReport from '../AddReport';
import EventFilter from '../EventFilter';
import MapLayerFilter from '../MapLayerFilter';
import HeatmapToggleButton from '../HeatmapToggleButton';
import { trackEvent } from '../utils/analytics';

import styles from './styles.module.scss';

import { ReactComponent as RefreshIcon } from '../common/images/icons/refresh-icon.svg';
import ClearAllControl from '../ClearAllControl';
import ReportMapControl from '../ReportMapControl';
import ErrorBoundary from '../ErrorBoundary';
import FriendlyEventFilterString from '../EventFilter/FriendlyEventFilterString';
import ErrorMessage from '../ErrorMessage';

const TAB_KEYS = {
  REPORTS: 'reports',
  LAYERS: 'layers',
}

const SideBar = (props) => {
  const { events, eventFilter, fetchEventFeed, fetchNextEventFeedPage, map, onHandleClick, reportHeatmapVisible, setReportHeatmapVisibility, sidebarOpen } = props;

  const [loadingEvents, setEventLoadState] = useState(false);
  const [activeTab, setActiveTab] = useState(TAB_KEYS.REPORTS);

  const addReportContainerRef = useRef(null);

  const onScroll = () => fetchNextEventFeedPage(events.next);

  const toggleReportHeatmapVisibility = () => setReportHeatmapVisibility(!reportHeatmapVisible);

  const onEventTitleClick = (event) => {
    openModalForReport(event, map);
    trackEvent('Feed', `Open ${event.is_collection ? 'Incident' : 'Event'} Report`, `Event Type:${event.event_type}`);
  };

  const onTabsSelect = (eventKey) => {
    setActiveTab(eventKey);
    let tabTitles = {
      [TAB_KEYS.REPORTS]: 'Reports',
      [TAB_KEYS.LAYERS]: 'Map Layers',
    };
    trackEvent('Drawer', `Click '${tabTitles[eventKey]}' tab`);
  };

  const loadFeedEvents = () => {
    setEventLoadState(true);
    fetchEventFeed({}, calcEventFilterForRequest())
      .then(() => setEventLoadState(false));
  };

  useEffect(() => {
    loadFeedEvents();
  }, [eventFilter]); // eslint-disable-line

  useEffect(() => {
    if (!sidebarOpen) {
      setActiveTab(TAB_KEYS.REPORTS);
    }
  }, [sidebarOpen]);

  const showEventFeedError = !loadingEvents && !!events.error;

  if (!map) return null;

  return <ErrorBoundary>
    <aside className={`${'side-menu'} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
      <button onClick={onHandleClick} className="handle" type="button"><span><ChevronIcon /></span></button>
      <Tabs activeKey={activeTab} onSelect={onTabsSelect}>
        <Tab className={styles.tab} eventKey={TAB_KEYS.REPORTS} title="Reports">
          <div ref={addReportContainerRef} className={styles.addReportContainer}>
            <AddReport map={map} container={addReportContainerRef} showLabel={false} />
          </div>
          <ErrorBoundary>
            <EventFilter className={styles.eventFilter}>
              <HeatmapToggleButton onButtonClick={toggleReportHeatmapVisibility} showLabel={false} heatmapVisible={reportHeatmapVisible} />
            </EventFilter>
          </ErrorBoundary>
          <FriendlyEventFilterString className={styles.friendlyFilterString} />
          <ErrorBoundary>
            {showEventFeedError && <div className={styles.feedError}>
              <ErrorMessage message='Could not load events. Please try again.' details={events.error} />
              <Button type='button' variant='primary' onClick={loadFeedEvents}>
                <RefreshIcon />
                Try again
              </Button>
            </div>}
            {!showEventFeedError && <EventFeed
              hasMore={!!events.next}
              map={map}
              loading={loadingEvents}
              events={events.results}
              onScroll={onScroll}
              onTitleClick={onEventTitleClick}
            />
            }
          </ErrorBoundary>
        </Tab>
        <Tab className={styles.tab} eventKey={TAB_KEYS.LAYERS} title="Map Layers">
          <ErrorBoundary>
            <MapLayerFilter />
            <div className={styles.mapLayers}>
              <ReportMapControl />
              <SubjectGroupList map={map} />
              <FeatureLayerList map={map} />
              <div className={styles.noItems}>No items to display.</div>
            </div>
            <div className={styles.mapLayerFooter}>
              <ClearAllControl map={map} />
            </div>
          </ErrorBoundary>
        </Tab>
      </Tabs>
    </aside>
  </ErrorBoundary>;
};

const mapStateToProps = (state) => ({
  events: getFeedEvents(state),
  eventFilter: state.data.eventFilter,
  sidebarOpen: state.view.userPreferences.sidebarOpen,
  reportHeatmapVisible: state.view.showReportHeatmap,
});

export default connect(mapStateToProps, { fetchEventFeed, fetchNextEventFeedPage, setReportHeatmapVisibility })(memo(SideBar));

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