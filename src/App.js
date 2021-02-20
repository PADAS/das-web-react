import React, { memo, useCallback, useEffect, useContext, useState } from 'react';
import Map from './Map';
import Nav from './Nav';
import { connect } from 'react-redux';
import { loadProgressBar } from 'axios-progress-bar';

import 'axios-progress-bar/dist/nprogress.css';

import { STATUSES } from './constants';
import { fetchMaps } from './ducks/maps';
import { setDirectMapBindingsForFeatureHighlightStates } from './utils/features';
import { hideZenDesk, initZenDesk } from './utils/zendesk';
import { fetchSystemStatus } from './ducks/system-status';
import { fetchEventTypes } from './ducks/event-types';
import { updateUserPreferences } from './ducks/user-preferences';
import { updateNetworkStatus } from './ducks/system-status';
import { setTrackLength, setDefaultTrackLength } from './ducks/tracks';
import { fetchSubjectGroups } from './ducks/subjects';
import { fetchFeaturesets } from './ducks/features';
import { fetchAnalyzers } from './ducks/analyzers';
import { fetchPatrolTypes } from './ducks/patrol-types';
import { fetchEventSchema } from './ducks/event-schemas';

import SideBar from './SideBar';
import PrintTitle from './PrintTitle';
import ModalRenderer from './ModalRenderer';
import ServiceWorkerWatcher from './ServiceWorkerWatcher';
import WithSocketContext, { SocketContext } from './withSocketConnection';
import { ReactComponent as ReportTypeIconSprite } from './common/images/sprites/event-svg-sprite.svg';
import { ReactComponent as EarthRangerLogoSprite } from './common/images/sprites/logo-svg-sprite.svg';
//  import ErrorBoundary from './ErrorBoundary';
//

import './App.scss';
import { trackEvent } from './utils/analytics';

const { HEALTHY_STATUS, UNHEALTHY_STATUS } = STATUSES;

// use this block to do direct map event binding.
// useful for API gaps between react-mapbox-gl and mapbox-gl.
// also useful for presentation manipulations which would consume unnecessary resources when manipulated through state via redux etc.
const bindDirectMapEventing = (map) => {
  setDirectMapBindingsForFeatureHighlightStates(map);
};

let mapResizeAnimation;

const animateResize = (map) => {
  const transitionLength = 500;
  const numberOfFrames = 8;
  let count = 0;

  clearInterval(mapResizeAnimation);

  mapResizeAnimation = setInterval(() => {
    count += 1;

    map.resize();

    if (count === numberOfFrames) {
      clearInterval(mapResizeAnimation);
    }
    
  }, (transitionLength / numberOfFrames));

  return mapResizeAnimation;
};


const App = (props) => {
  const { fetchMaps, fetchEventTypes, fetchEventSchema, fetchAnalyzers, fetchPatrolTypes, fetchSubjectGroups, fetchFeaturesets, fetchSystemStatus, pickingLocationOnMap, 
    sidebarOpen, updateNetworkStatus, updateUserPreferences, trackLength, setTrackLength, setDefaultTrackLength } = props;
  const [map, setMap] = useState(null);

  const [isDragging, setDragState] = useState(false);

  const socket = useContext(SocketContext);

  const onMapHasLoaded = useCallback((map) => {
    setMap(map);
    fetchFeaturesets();
    bindDirectMapEventing(map);
  }, [fetchFeaturesets]);

  const disallowDragAndDrop = useCallback((e) => {
    setDragState(true);
    e.preventDefault();
  }, []);

  const finishDrag = useCallback(() => {
    setDragState(false);
  }, []);

  const onSidebarHandleClick = useCallback(() => {
    updateUserPreferences({ sidebarOpen: !sidebarOpen });
    trackEvent('Drawer', `${sidebarOpen ? 'Close' : 'open'} Drawer`, null);
  }, [sidebarOpen, updateUserPreferences]);


  useEffect(() => {
    /* use these catch blocks to provide error toasts if/as desired */
    fetchEventTypes()
      .catch((e) => {
      });
    fetchEventSchema()
      .catch((e) => {
        // 
      });
    fetchMaps()
      .catch((e) => {
        // 
      });
    fetchSubjectGroups()
      .catch((e) => {
        // 
      });
    fetchAnalyzers()
      .catch((e) => {
        // 
      });
    fetchSystemStatus()
      .then(({ patrol_enabled, track_length }) => {
        if (patrol_enabled) {
          fetchPatrolTypes()
            .catch((e) => {
              // 
            });
        }
        if (track_length) {
          setDefaultTrackLength(track_length);
          const { hasCustomTrackLength } = trackLength;
          if(!hasCustomTrackLength) {
            setTrackLength(track_length);
          }
        }
      })
      .catch((e) => {
        /* toast('Error fetching system status. Please refresh and try again.', {
          type: toast.TYPE.ERROR,
        }); */
      });
    loadProgressBar();
    window.addEventListener('online', () => {
      updateNetworkStatus(HEALTHY_STATUS);
    });
    window.addEventListener('offline', () => {
      updateNetworkStatus(UNHEALTHY_STATUS);
    });
    initZenDesk();
    hideZenDesk();
    
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (map) {
      const resizeAnimation = () => animateResize(map);

      window.addEventListener('resize', resizeAnimation);
      return () => {
        window.removeEventListener('resize', resizeAnimation);
      };
    }
  }, [map]);

  useEffect(() => {
    if (map) {
      animateResize(map);
    }
  }, [map, sidebarOpen]); 

  return <div className={`App ${isDragging ? 'dragging' : ''} ${pickingLocationOnMap ? 'picking-location' : ''}`} onDrop={finishDrag} onDragLeave={finishDrag} onDragOver={disallowDragAndDrop} onDrop={disallowDragAndDrop}> {/* eslint-disable-line react/jsx-no-duplicate-props */}
    <PrintTitle />
    <Nav map={map} />
    <div className={`app-container ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        
      {/* <ErrorBoundary> */}
      <Map map={map} onMapLoad={onMapHasLoaded} socket={socket} pickingLocationOnMap={pickingLocationOnMap} />
      {/* </ErrorBoundary> */}
      {/* <ErrorBoundary> */}
      {!!map && <SideBar onHandleClick={onSidebarHandleClick} map={map} />}
      {/* </ErrorBoundary> */}
      <ModalRenderer map={map} />
    </div>
    <div style={{
      display: 'none',
      height: 0,
      width: 0,
    }}>
      <ReportTypeIconSprite id="reportTypeIconSprite" />
      <EarthRangerLogoSprite />
    </div>
    <ServiceWorkerWatcher />
  </div>;
};

const mapStateToProps = ({ view: { trackLength, userPreferences: { sidebarOpen }, pickingLocationOnMap } }) => ({ trackLength, pickingLocationOnMap, sidebarOpen });
const ConnectedApp = connect(mapStateToProps, { fetchMaps, fetchEventSchema, fetchFeaturesets, fetchAnalyzers, fetchPatrolTypes, fetchEventTypes, fetchSubjectGroups, fetchSystemStatus, updateUserPreferences, updateNetworkStatus, setTrackLength, setDefaultTrackLength })(memo(App));

const AppWithSocketContext = (props) => <WithSocketContext>
  <ConnectedApp />
</WithSocketContext>;




export default AppWithSocketContext;
