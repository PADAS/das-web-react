import React, { useEffect, useState, memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Tabs, Tab } from 'react-bootstrap';

import { openModalForEvent } from '../utils/events';

import { fetchEvents, fetchNextEventPage } from '../ducks/events';
import SubjectGroupList from '../SubjectGroupList';
import FeatureLayerList from '../FeatureLayerList';
import EventFeed from '../EventFeed';
import styles from './styles.module.scss';
import EventFilter from '../EventFilter';

const SideBar = memo((props) => {
  const { events, eventFilter, fetchEvents, fetchNextEventPage, map, onHandleClick } = props;

  const [loadingEvents, setEventLoadState] = useState(false);

  const onScroll = () => fetchNextEventPage(events.next);

  useEffect(() => {
    setEventLoadState(true);
    fetchEvents().then(() => setEventLoadState(false));
  }, [eventFilter]);

  if (!map) return null;

  return (
    <aside className='side-menu'>
      <button onClick={onHandleClick} className="handle" type="button"><span>>></span></button>
      <Tabs>
        <Tab className={styles.tab} eventKey="reports" title="Reports">
          <EventFilter />
          <EventFeed
            hasMore={!!events.next}
            map={map}
            loading={loadingEvents}
            events={events.results}
            onScroll={onScroll}
            onTitleClick={openModalForEvent}
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

const mapStateToProps = ({ data: { eventFilter }, data: { events } }) => ({ eventFilter, events });

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