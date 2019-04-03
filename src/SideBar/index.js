import React, { useEffect, memo } from 'react';
import { connect } from 'react-redux';
import { fetchEvents, fetchNextEventPage } from '../ducks/events';
import { getCoordinatesForEvent } from '../utils/events';
import EventFeed from '../EventFeed';
import './SideBar.scss';

const SideBar = memo((props) => {
  const { events, eventFilter, fetchEvents, fetchNextEventPage, map } = props;

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
    fetchEvents(eventFilter);
  }, [eventFilter]);

  return (
    <aside className="side-menu">
      <EventFeed
        hasMore={!!events.next}
        events={events.results}
        onJumpClick={goToEventLocation}
        onScroll={() => fetchNextEventPage(events.next)} />
    </aside>
  );
});

const mapStateToProps = ({ view: { eventFilter }, data: { events } }) => ({ eventFilter, events });

export default connect(mapStateToProps, { fetchEvents, fetchNextEventPage })(SideBar);