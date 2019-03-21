import './App.css';
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
import { NETWORK_STATUS_CHANGE } from './ducks/system-status';
import { store } from './index';

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
      store.dispatch({
        type: NETWORK_STATUS_CHANGE,
        payload: HEALTHY_STATUS,
      });
    });
    window.addEventListener('offline', () => {
      store.dispatch({
        type: NETWORK_STATUS_CHANGE,
        payload: UNHEALTHY_STATUS,
      });
    });
  }

  componentWillUnmount() {
    window.removeEventListener('online');
    window.removeEventListener('offline');
  }

  render() {
    return (
      <div className="App">
        <Nav />
        <div className="app-container">
          <Map />
          <SideBar />
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({ view: { eventFilter } }) => ({ eventFilter });

export default connect(mapStateToProps, { fetchEvents, fetchMaps, fetchEventTypes, fetchSystemStatus })(App);