import './App.css';
import React, { Component } from 'react';
import Map from './Map';
import Nav from './Nav';
import { connect } from 'react-redux';
import { fetchEvents } from './ducks/events';
import { fetchMaps } from './ducks/maps';
import { fetchEventTypes } from './ducks/event-types';
import SideBar from './SideBar';
import 'axios-progress-bar/dist/nprogress.css'
import { loadProgressBar } from 'axios-progress-bar';

class App extends Component {
  componentDidMount() {
    /* data initialization */
    this.props.fetchEvents(this.props.eventFilter);
    this.props.fetchMaps();
    this.props.fetchEventTypes();
    loadProgressBar();
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

export default connect(mapStateToProps, { fetchEvents, fetchMaps, fetchEventTypes })(App);