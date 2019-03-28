import React, { Component } from 'react';
import InfiniteScroll from 'react-infinite-scroller';

export default class EventFeed extends Component {
  onEventClick(event) {
  }
  renderEventList() {
    return this.props.events.map((event) => (
      <li key={event.id}>
        <a onClick={() => this.onEventClick(event)}>{event.title}</a>
      </li>
    ));
  }
  render() {
    return (
      <ul>
        <InfiniteScroll
          hasMore={this.props.hasMore}
          loadMore={this.props.onScroll}
          useWindow={false}
          loader={<div className="loader" key={0}>Loading more events...</div>}
        >
          {this.renderEventList()}
        </InfiniteScroll>
      </ul>
    )
  }
}