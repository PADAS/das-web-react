import React, { useEffect, useState, useRef, memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Tabs, Tab } from 'react-bootstrap';

import { openModalForReport } from '../utils/events';

import { fetchEvents, fetchNextEventPage } from '../ducks/events';
import SubjectGroupList from '../SubjectGroupList';
import FeatureLayerList from '../FeatureLayerList';
import EventFeed from '../EventFeed';
import AddReport from '../AddReport';
import EventFilter from '../EventFilter';

import styles from './styles.module.scss';

const SideBar = memo((props) => {
  const { events, eventFilter, fetchEvents, fetchNextEventPage, map, onHandleClick, sidebarOpen } = props;

  const [loadingEvents, setEventLoadState] = useState(false);
  const addReportContainerRef = useRef(null);

  const onScroll = () => fetchNextEventPage(events.next);

  const onEventTitleClick = event => openModalForReport(event, map);

  useEffect(() => {
    setEventLoadState(true);
    fetchEvents().then(() => setEventLoadState(false));
  }, [eventFilter]);

  if (!map) return null;

  return (
    <aside className={`${'side-menu'} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
      <button onClick={onHandleClick} className="handle" type="button"><span>>></span></button>
      <Tabs>
        <Tab className={styles.tab} eventKey="reports" title="Reports">
          <div ref={addReportContainerRef} className={styles.addReportContainer}>
            <AddReport map={map} container={addReportContainerRef} showLabel={false} />
          </div>
          <EventFilter />
          <EventFeed
            hasMore={!!events.next}
            map={map}
            loading={loadingEvents}
            events={events.results}
            onScroll={onScroll}
            onTitleClick={onEventTitleClick}
          />
        </Tab>
        <Tab className={`${styles.tab} ${styles.mapLayers}`} eventKey="layers" title="Map Layers">
          <SubjectGroupList map={map} />
          <FeatureLayerList map={map} />
        </Tab>
      </Tabs>
    </aside>
  );
});

const mapStateToProps = ({ data: { eventFilter }, data: { events }, view: { userPreferences: { sidebarOpen } } }) => ({ eventFilter, events, sidebarOpen });

export default connect(mapStateToProps, { fetchEvents, fetchNextEventPage })(SideBar);

SideBar.propTypes = {
  events: PropTypes.shape({
    count: PropTypes.number,
    next: PropTypes.string,
    previous: PropTypes.string,
    results: PropTypes.array,
  }).isRequired,
  eventFilter: PropTypes.object.isRequired,
  onHandleClick: PropTypes.func.isRequired,
  fetchEvents: PropTypes.func.isRequired,
  fetchNextEventPage: PropTypes.func.isRequired,
  map: PropTypes.object,
};