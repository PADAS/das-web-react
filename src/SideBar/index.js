import React, { useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Tabs, Tab } from 'react-bootstrap';

import { fetchEvents, fetchNextEventPage } from '../ducks/events';
import SubjectGroupList from '../SubjectGroupList';
import FeatureLayerList from '../FeatureLayerList';
import EventFeed from '../EventFeed';
import styles from './styles.module.scss';

const SideBar = memo((props) => {
  const { events, eventFilter, onHandleClick, fetchEvents, fetchNextEventPage, map } = props;


  const onScroll = () => fetchNextEventPage(events.next); 

  useEffect(() => {
    fetchEvents({
      params: eventFilter,
    });
  }, [eventFilter]);

  if (!map) return null;

  return (
    <aside className='side-menu'>
      <button onClick={onHandleClick} className="handle" type="button"><span>>></span></button>
      <Tabs>
        <Tab className={styles.tab} eventKey="events" title="Events">
          <EventFeed
            hasMore={!!events.next}
            map={map}
            events={events.results}
            onScroll={onScroll} />
        </Tab>
        <Tab className={styles.tab} eventKey="layers" title="Map Layers">
          <SubjectGroupList map={map} />
          <FeatureLayerList map={map} />
        </Tab>
      </Tabs>
    </aside>
  );
});

const mapStateToProps = ({ view: { eventFilter }, data: { events } }) => ({ eventFilter, events });

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