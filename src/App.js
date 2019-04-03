import './App.scss';
import React, { memo, useEffect, useState } from 'react';
import Map from './Map';
import Nav from './Nav';
import { connect } from 'react-redux';
import { fetchMaps } from './ducks/maps';
import { fetchSystemStatus } from './ducks/system-status';
import SideBar from './SideBar';
import 'axios-progress-bar/dist/nprogress.css'
import { loadProgressBar } from 'axios-progress-bar';
import { fetchEventTypes } from './ducks/event-types';

import { STATUSES } from './constants';
import { updateNetworkStatus } from './ducks/system-status';

import { ReactComponent as ReportTypeIconSprite } from './common/images/sprites/event-svg-sprite.svg';

const { HEALTHY_STATUS, UNHEALTHY_STATUS } = STATUSES;

const App = memo((props) => {
  const { fetchMaps, fetchEventTypes, fetchSystemStatus, updateNetworkStatus } = props;
  const [map, setMap] = useState(null);

  useEffect(() => {
    fetchMaps();
    fetchSystemStatus();
    fetchEventTypes();
    loadProgressBar();
    window.addEventListener('online', () => {
      updateNetworkStatus(HEALTHY_STATUS);
    });
    window.addEventListener('offline', () => {
      updateNetworkStatus(UNHEALTHY_STATUS);
    });
  }, []);

  return (
    <div className="App">
      <Nav />
      <div className="app-container">
        <Map map={map} onMapLoad={map => setMap(map)} />
        <SideBar map={map} />
      </div>
      <ReportTypeIconSprite id="reportTypeIconSprite" />
    </div>
  );
});

export default connect(null, { fetchMaps, fetchEventTypes, fetchSystemStatus, updateNetworkStatus })(App);