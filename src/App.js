import React, { memo, useEffect, useState } from 'react';
import Map from './Map';
import Nav from './Nav';
import { connect } from 'react-redux';
import { loadProgressBar } from 'axios-progress-bar';

import 'axios-progress-bar/dist/nprogress.css';

import { STATUSES } from './constants';
import { fetchMaps } from './ducks/maps';
import { setDirectMapBindingsForFeatureHighlightStates } from './utils/features';
import { fetchSystemStatus } from './ducks/system-status';
import { fetchEventTypes } from './ducks/event-types';
import { updateUserPreferences } from './ducks/user-preferences';
import { updateNetworkStatus } from './ducks/system-status';
import { fetchSubjectGroups } from './ducks/subjects';
import { fetchFeaturesets } from './ducks/features';
import { fetchEventSchema } from './ducks/event-schemas';

import SideBar from './SideBar';
import PrintTitle from './PrintTitle';
import ModalRenderer from './ModalRenderer';
import { ReactComponent as ReportTypeIconSprite } from './common/images/sprites/event-svg-sprite.svg';
import { ReactComponent as EarthRangerLogoSprite } from './common/images/sprites/logo-svg-sprite.svg';

import './App.scss';
import { trackEvent } from './utils/analytics';

const { HEALTHY_STATUS, UNHEALTHY_STATUS } = STATUSES;

let interval, mapInterval, zendeskInterval;


const resizeInterval = (map) => {
  clearInterval(interval);
  const transitionLength = 300;
  const numberOfFrames = 2;
  let count = 0;
  interval = setInterval(() => {
    count += 1;
    map.resize();
    if (count > (transitionLength / numberOfFrames)) clearInterval(interval);
  }, numberOfFrames);
};

const setZendeskInterval = () => {
  zendeskInterval = setInterval(() => {
    if (window.zE && window.zE.hide) {
      window.zE(function () {
        window.zE.hide();
        clearInterval(zendeskInterval);
      });
    }
  }, 1000);
};

let mapResized = false;

// use this block to do direct map event binding.
// useful for API gaps between react-mapbox-gl and mapbox-gl.
// also useful for presentation manipulations which would consume unnecessary resources when manipulated through state via redux etc.
const bindDirectMapEventing = (map) => {
  setDirectMapBindingsForFeatureHighlightStates(map);
};


const App = (props) => {
  const { fetchMaps, fetchEventTypes, fetchEventSchema, fetchSubjectGroups, fetchFeaturesets, fetchSystemStatus, pickingLocationOnMap, sidebarOpen, updateNetworkStatus, updateUserPreferences, zendeskEnabled } = props;
  const [map, setMap] = useState(null);

  const [isDragging, setDragState] = useState(false);

  const onMapHasLoaded = (map) => {
    setMap(map);
    fetchFeaturesets();
    bindDirectMapEventing(map);
  };

  const disallowDragAndDrop = (e) => {
    setDragState(true);
    e.preventDefault();
  };

  const finishDrag = () => {
    setDragState(false);
  };

  const onSidebarHandleClick = () => {
    updateUserPreferences({ sidebarOpen: !sidebarOpen });
    trackEvent('Drawer', `${sidebarOpen?'Close':'open'} Drawer`, null);
  };

  clearInterval(mapInterval);
  mapInterval = setInterval(() => {
    if (!mapResized || !map) return;
    mapResized && map && map.resize();
    mapResized = false;
  }, 3000);

  useEffect(() => {
    fetchEventTypes();
    fetchEventSchema();
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (zendeskEnabled) {
      setZendeskInterval();
    }
  }, [zendeskEnabled]);

  useEffect(() => {
    if (map) {
      resizeInterval(map);
    }
  }, [sidebarOpen]); // eslint-disable-line react-hooks/exhaustive-deps


  return (
    <div className={`App ${isDragging ? 'dragging' : ''} ${pickingLocationOnMap ? 'picking-location' : ''}`} onDrop={finishDrag} onDragLeave={finishDrag} onDragOver={disallowDragAndDrop} onDrop={disallowDragAndDrop}> {/* eslint-disable-line react/jsx-no-duplicate-props */}
      <PrintTitle />
      <Nav map={map} />
      <div className={`app-container ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Map map={map} onMapLoad={onMapHasLoaded} />
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
};

const mapStateToProps = ({ view: { userPreferences: { sidebarOpen }, systemConfig: { zendeskEnabled }, pickingLocationOnMap } }) => ({ pickingLocationOnMap, sidebarOpen, zendeskEnabled });

export default connect(mapStateToProps, { fetchMaps, fetchEventSchema, fetchFeaturesets, fetchEventTypes, fetchSubjectGroups, fetchSystemStatus, updateUserPreferences, updateNetworkStatus })(memo(App));