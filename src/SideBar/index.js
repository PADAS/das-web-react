import React, { Component } from 'react';
import { connect } from 'react-redux';
// import SchemaForm from "react-jsonschema-form";
import { fetchEventFilterSchema } from '../ducks/filters';
import { fetchNextEventPage } from '../ducks/events';
import EventFeed from '../EventFeed';
import './SideBar.scss';

class SideBar extends Component {
  constructor(props) {
    super(props);
    this.fetchMoreEventsOnScroll = this.fetchMoreEventsOnScroll.bind(this);
  }
  componentDidMount() {
    this.props.fetchEventFilterSchema();
  }
  fetchMoreEventsOnScroll() {
    return this.props.fetchNextEventPage(this.props.events.next);
  }
  render() {
    return (
      <aside className="side-menu">
        {/* <SchemaForm style="overflow: auto" schema={this.props.eventFilterSchema} onChange={() => console.log("changed")}
          onSubmit={() => console.log("submitted")}
          onError={() => console.log("errors")} /> */}
        <EventFeed
          hasMore={!!this.props.events.next}
          events={this.props.events.results}
          onScroll={this.fetchMoreEventsOnScroll} />
      </aside>
    );
  }
}

const mapStateToProps = ({ data: { events }, view: { eventFilterSchema } }) => ({ events, eventFilterSchema });

export default connect(mapStateToProps, { fetchNextEventPage, fetchEventFilterSchema })(SideBar);