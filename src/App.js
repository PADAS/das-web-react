import React, { memo, useEffect, useState } from 'react';
import Map from './Map';
import Nav from './Nav';
import { connect } from 'react-redux';
import { loadProgressBar } from 'axios-progress-bar';
import debounce from 'lodash/debounce';

import 'axios-progress-bar/dist/nprogress.css'

import { fetchMaps } from './ducks/maps';
import { fetchSystemStatus } from './ducks/system-status';
import { fetchEventTypes } from './ducks/event-types';
import { setSidebarState } from './ducks/map-ui';
import { updateNetworkStatus } from './ducks/system-status';

import SideBar from './SideBar';
import { STATUSES } from './constants';
import './App.scss';
import { ReactComponent as ReportTypeIconSprite } from './common/images/sprites/event-svg-sprite.svg';
import { ReactComponent as EarthRangerLogoSprite } from './common/images/sprites/logo-svg-sprite.svg';

const { HEALTHY_STATUS, UNHEALTHY_STATUS } = STATUSES;

const resizeInterval = (map) => {
  const transitionLength = 300;
  const frameRate = 10;
  let count = 0;
  const interval = setInterval(() => {
    count += 1;
    map.resize();
    if (count > (transitionLength / frameRate)) clearInterval(interval);
  }, frameRate);
};

let mapResized = false;

const App = memo((props) => {
  const { fetchMaps, fetchEventTypes, fetchSystemStatus, updateNetworkStatus, sidebarOpen, setSidebarState } = props;
  const [map, setMap] = useState(null);

  setInterval(() => {
    if (!mapResized || !map) return;
    mapResized && map && map.resize();
    mapResized = false;
  }, 3000);

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
    window.addEventListener('resize', () => {
      mapResized = true;
    });
  }, []);

  return (
    <div className="App">
      <Nav />
      <div className={`app-container ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Map map={map} onMapLoad={(map) => {
          setMap(map);
          window.map = map;
        }} />
        <SideBar onHandleClick={() => {
          setSidebarState(!sidebarOpen);
          resizeInterval(map);
        }} map={map} />
      </div>
      <div style={{
        display: 'none',
      }}>
        <ReportTypeIconSprite id="reportTypeIconSprite" />
        <EarthRangerLogoSprite />
      </div>
    </div>
  );
});

const mapStateToProps = ({ view: { sidebarState: { open } } }) => ({ sidebarOpen: open })

export default connect(mapStateToProps, { fetchMaps, fetchEventTypes, fetchSystemStatus, setSidebarState, updateNetworkStatus })(App);