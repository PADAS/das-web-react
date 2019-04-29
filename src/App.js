import React, { memo, useEffect, useState } from 'react';
import Map from './Map';
import Nav from './Nav';
import { connect } from 'react-redux';
import { loadProgressBar } from 'axios-progress-bar';

import 'axios-progress-bar/dist/nprogress.css'

import { STATUSES } from './constants';
import { fetchMaps } from './ducks/maps';
import { fetchSystemStatus } from './ducks/system-status';
import { fetchEventTypes } from './ducks/event-types';
import { updateUserPreferences } from './ducks/user-preferences';
import { updateNetworkStatus } from './ducks/system-status';
import { fetchSubjectGroups } from './ducks/subjects';

import SideBar from './SideBar';
import ModalRenderer from './ModalRenderer';
import { ReactComponent as ReportTypeIconSprite } from './common/images/sprites/event-svg-sprite.svg';
import { ReactComponent as EarthRangerLogoSprite } from './common/images/sprites/logo-svg-sprite.svg';

import './App.scss';

const { HEALTHY_STATUS, UNHEALTHY_STATUS } = STATUSES;

let interval, mapInterval, zendeskInterval;


const resizeInterval = (map) => {
  clearInterval(interval);
  const transitionLength = 300;
  const frameRate = 10;
  let count = 0;
  interval = setInterval(() => {
    count += 1;
    map.resize();
    if (count > (transitionLength / frameRate)) clearInterval(interval);
  }, frameRate);
};

const setZendeskInterval = () => {
  zendeskInterval = setInterval(() => {
    if (window.zE && window.zE.hide) {
      window.zE(function () {
        window.zE.hide();
        clearInterval(zendeskInterval);
      });
    }
  }, 100);
}

let mapResized = false;

const App = memo((props) => {
  const { fetchMaps, fetchEventTypes, fetchSubjectGroups, fetchSystemStatus, updateNetworkStatus, sidebarOpen, updateUserPreferences, zendeskEnabled } = props;
  const [map, setMap] = useState(null);

  const onSidebarHandleClick = () => {
    updateUserPreferences({ sidebarOpen: !sidebarOpen });
    resizeInterval(map);
  };

  clearInterval(mapInterval);
  mapInterval = setInterval(() => {
    if (!mapResized || !map) return;
    mapResized && map && map.resize();
    mapResized = false;
  }, 3000);

  useEffect(() => {
    fetchEventTypes();
    fetchMaps();
    fetchSubjectGroups();
    fetchSystemStatus();
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

  useEffect(() => {
    if (zendeskEnabled && zendeskEnabled.enabled) {
      setZendeskInterval();
    }
  }, [zendeskEnabled])

  return (
    <div className="App">
      <Nav />
      <div className={`app-container ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Map map={map} onMapLoad={setMap} />
        {!!map && <SideBar onHandleClick={onSidebarHandleClick} map={map} />}
        <ModalRenderer />
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

const mapStateToProps = ({ view: { userPreferences: { sidebarOpen }, zendeskEnabled } }) => ({ sidebarOpen, zendeskEnabled })

export default connect(mapStateToProps, { fetchMaps, fetchEventTypes, fetchSubjectGroups, fetchSystemStatus, updateUserPreferences, updateNetworkStatus })(App);