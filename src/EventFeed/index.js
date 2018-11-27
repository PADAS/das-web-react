import React, { Component } from 'react';

export default class EventFeed extends Component {
  renderEventList() {
    return this.props.events.map((event) => (
      <li key={event.id}>
        <a>{event.title}</a>
      </li>
    ));
  }
  render() {
    return (
      <ul>
        {this.renderEventList()}
      </ul>
    )
  }
}