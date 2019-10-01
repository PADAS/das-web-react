import React, { useEffect, useState, useRef, memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';

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

const SideBar = (props) => {
  const { events, eventFilter, fetchEventFeed, fetchNextEventFeedPage, map, onHandleClick, reportHeatmapVisible, setReportHeatmapVisibility, sidebarOpen } = props;

  const [loadingEvents, setEventLoadState] = useState(false);
  const addReportContainerRef = useRef(null);

  const onScroll = () => fetchNextEventFeedPage(events.next);

  const toggleReportHeatmapVisibility = () => setReportHeatmapVisibility(!reportHeatmapVisible);

  const onEventTitleClick = (event) => {
    openModalForReport(event, map);
    trackEvent('Feed', `Open ${event.is_collection?'Incident':'Event'} Report`, `Event Type:${event.event_type}`);
  };

  const onTabsSelect = (eventKey) => {
    let tabTitles = {
      'reports': 'Reports',
      'layers': 'Map Layers',
    };
    trackEvent('Drawer', `Click '${tabTitles[eventKey]}' tab`);
  };

  useEffect(() => {
    setEventLoadState(true);
    fetchEventFeed({}, calcEventFilterForRequest())
      .then(() => setEventLoadState(false));
  }, [eventFilter, fetchEventFeed]);

  if (!map) return null;

  return (
    <aside className={`${'side-menu'} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
      <button onClick={onHandleClick} className="handle" type="button"><span><ChevronIcon /></span></button>
      <Tabs onSelect={onTabsSelect}>
        <Tab className={styles.tab} eventKey="reports" title="Reports">
          <div ref={addReportContainerRef} className={styles.addReportContainer}>
            <AddReport map={map} container={addReportContainerRef} showLabel={false} />
          </div>
          <EventFilter>
            <HeatmapToggleButton onButtonClick={toggleReportHeatmapVisibility} showLabel={false} heatmapVisible={reportHeatmapVisible}  />
          </EventFilter>
          <EventFeed
            hasMore={!!events.next}
            map={map}
            loading={loadingEvents}
            events={events.results}
            onScroll={onScroll}
            onTitleClick={onEventTitleClick}
          />
        </Tab>
        <Tab className={styles.tab} eventKey="layers" title="Map Layers">
          <MapLayerFilter />
          <div className={styles.mapLayers}>
            <SubjectGroupList map={map} />
            <FeatureLayerList map={map} />
            <div className={styles.noItems}>No items to display.</div>
          </div>
        </Tab>
      </Tabs>
    </aside>
  );
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