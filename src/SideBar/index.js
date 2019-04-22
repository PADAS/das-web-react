import React, { useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Tabs, Tab } from 'react-bootstrap';

import { fetchEvents, fetchNextEventPage } from '../ducks/events';
import { getCoordinatesForEvent } from '../utils/events';
import SubjectGroupList from '../SubjectGroupList';
import EventFeed from '../EventFeed';
import styles from './styles.module.scss';

const SideBar = memo((props) => {
  const { events, eventFilter, onHandleClick, fetchEvents, fetchNextEventPage, hiddenSubjectIDs, map } = props;

  const goToEventLocation = (event) => {
    if (event.is_collection) {
      // do some collection stuff buddy
    } else {
      map.jumpTo({
        center: getCoordinatesForEvent(event),
        zoom: 19,
      });
    }
  };

  useEffect(() => {
    fetchEvents({
      params: eventFilter,
    });
  }, [eventFilter]);

  return (
    <aside className='side-menu'>
      <button onClick={onHandleClick} className="handle" type="button"><span>>></span></button>
      <Tabs>
        <Tab className={styles.tab} eventKey="events" title="Events">
          <EventFeed
            hasMore={!!events.next}
            events={events.results}
            onJumpClick={goToEventLocation}
            onScroll={() => fetchNextEventPage(events.next)} />
        </Tab>
        <Tab className={styles.tab} eventKey="layers" title="Map Layers">
          <SubjectGroupList />
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