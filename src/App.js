import './App.scss';
import React, { memo, useEffect } from 'react';
import Map from './Map';
import Nav from './Nav';
import { connect } from 'react-redux';
import { fetchMaps } from './ducks/maps';
import { fetchSystemStatus } from './ducks/system-status';
import SideBar from './SideBar';
import 'axios-progress-bar/dist/nprogress.css'
import { loadProgressBar } from 'axios-progress-bar';

import { STATUSES } from './constants';
import { updateNetworkStatus } from './ducks/system-status';

import { ReactComponent as ReportTypeIconSprite } from './common/images/sprites/event-svg-sprite.svg';

const { HEALTHY_STATUS, UNHEALTHY_STATUS } = STATUSES;

const App = memo((props) => {
  const { fetchMaps, fetchSystemStatus, updateNetworkStatus, ...rest } = props;

  useEffect(() => {
    fetchMaps();
    fetchSystemStatus();
    loadProgressBar();
    window.addEventListener('online', () => {
      this.props.updateNetworkStatus(HEALTHY_STATUS);
    });
    window.addEventListener('offline', () => {
      this.props.updateNetworkStatus(UNHEALTHY_STATUS);
    });
  }, []);

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
});

export default connect(null, { fetchMaps, fetchSystemStatus, updateNetworkStatus })(App);