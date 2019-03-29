import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import InfiniteScroll from 'react-infinite-scroller';

import { displayTitleForEventByEventType } from '../utils/events';

class EventFeed extends Component {
  onEventClick(event) {
  }
  renderEventList() {
    const { events, eventTypes } = this.props;
    return events.map((event) => (
      <li key={event.id}>
        <a onClick={() => this.onEventClick(event)}>{displayTitleForEventByEventType(event, eventTypes)}</a>
      </li>
    ));
  }
  render() {
    const { hasMore, onScroll } = this.props;
    return (
      <ul>
        <InfiniteScroll
          hasMore={hasMore}
          loadMore={onScroll}
          useWindow={false}
          loader={<div className="loader" key={0}>Loading more events...</div>}
        >
          {this.renderEventList()}
        </InfiniteScroll>
      </ul>
    )
  }
}

const mapStateToProps = ({ data: { eventTypes } }) => ({ eventTypes });

export default connect(mapStateToProps, null)(EventFeed);

EventFeed.propTypes = {
  events: PropTypes.array.isRequired,
  hasMore: PropTypes.bool.isRequired,
  onScroll: PropTypes.func.isRequired,
};