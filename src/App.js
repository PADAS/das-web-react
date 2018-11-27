import './App.css';
import React, { Component } from 'react';
import Map from './Map';
import Nav from './Nav';
import { connect } from 'react-redux';
import { fetchEvents/* , fetchEventTypes */ } from './ducks/events';
import { fetchMaps } from './ducks/maps';
import { fetchEventTypes } from './ducks/event-types';
import SideBar from './SideBar';

class App extends Component {

  componentDidMount() {
    /* top-level data initialization */
    this.props.fetchEvents();
    this.props.fetchMaps();
    this.props.fetchEventTypes();
  }
  
  render() {
    return (
      <div className="App">
        <Nav />
        <div className="container">
          <Map />
          <SideBar events={this.props.events} />
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({ data: { events, maps } }) => ({ events, maps });

export default connect(mapStateToProps, { fetchEvents, fetchMaps, fetchEventTypes })(App);