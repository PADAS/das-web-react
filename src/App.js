import './App.scss';
import React, { Component } from 'react';
import Map from './Map';
import Nav from './Nav';
import { connect } from 'react-redux';
import { fetchEvents } from './ducks/events';
import { fetchMaps } from './ducks/maps';
import { fetchEventTypes } from './ducks/event-types';
import { fetchSystemStatus } from './ducks/system-status';
import SideBar from './SideBar';
import 'axios-progress-bar/dist/nprogress.css'
import { loadProgressBar } from 'axios-progress-bar';

import { STATUSES } from './constants';
import { updateNetworkStatus } from './ducks/system-status';

import { ReactComponent as ReportTypeIconSprite } from './common/images/sprites/event-svg-sprite.svg';

const { HEALTHY_STATUS, UNHEALTHY_STATUS } = STATUSES;

class App extends Component {
  componentDidMount() {
    /* data initialization */
    this.props.fetchEvents(this.props.eventFilter);
    this.props.fetchMaps();
    this.props.fetchEventTypes();
    this.props.fetchSystemStatus();
    loadProgressBar();

    window.addEventListener('online', () => {
      this.props.updateNetworkStatus(HEALTHY_STATUS);
    });
    window.addEventListener('offline', () => {
      this.props.updateNetworkStatus(UNHEALTHY_STATUS);
    });
  }

  render() {
    return (
      <div className="App">
        <Nav />
        <div className="app-container">
          <Map />
          <SideBar />
        </div>
        <ReportTypeIconSprite id="reportTypeIconSprite" />
      </div>
    );
  }
}

const mapStateToProps = ({ view: { eventFilter } }) => ({ eventFilter });

export default connect(mapStateToProps, { fetchEvents, fetchMaps, fetchEventTypes, fetchSystemStatus, updateNetworkStatus })(App);