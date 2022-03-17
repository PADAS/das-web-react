import React, { createContext, memo, useCallback, useEffect, useContext, useState } from 'react';
import Map from './Map';
import Nav from './Nav';
import { connect } from 'react-redux';
import { loadProgressBar } from 'axios-progress-bar';
import { ToastContainer, toast } from 'react-toastify';
import 'axios-progress-bar/dist/nprogress.css';

import { fetchMaps } from './ducks/maps';
import { setDirectMapBindingsForFeatureHighlightStates } from './utils/features';
import { geoPermWarningSplashToastIsDueToBeShown, userIsGeoPermissionRestricted } from './utils/geo-perms';
import { hideZenDesk, initZenDesk } from './utils/zendesk';
import { trackEventFactory, DRAWER_CATEGORY } from './utils/analytics';
import { fetchSystemStatus } from './ducks/system-status';
import { fetchEventTypes } from './ducks/event-types';
import { updateUserPreferences } from './ducks/user-preferences';
import { setTrackLength, setDefaultCustomTrackLength } from './ducks/tracks';
import { fetchSubjectGroups } from './ducks/subjects';
import { fetchFeaturesets } from './ducks/features';
import { fetchAnalyzers } from './ducks/analyzers';
import { fetchPatrolTypes } from './ducks/patrol-types';
import { fetchEventSchema } from './ducks/event-schemas';
import { setSeenSplashWarningMessage } from './ducks/geo-perm-ui';

import Drawer from './Drawer';
import SideBar from './SideBar';
import PrintTitle from './PrintTitle';
import ModalRenderer from './ModalRenderer';
import ServiceWorkerWatcher from './ServiceWorkerWatcher';
import WithSocketContext, { SocketContext } from './withSocketConnection';
import { ReactComponent as ReportTypeIconSprite } from './common/images/sprites/event-svg-sprite.svg';
import { ReactComponent as EarthRangerLogoSprite } from './common/images/sprites/logo-svg-sprite.svg';

import './App.scss';
import { showToast } from './utils/toast';

const drawerTracker = trackEventFactory(DRAWER_CATEGORY);

export const MapContext = createContext(null);

// use this block to do direct map event binding.
// useful for API gaps between react-mapbox-gl and mapbox-gl.
// also useful for presentation manipulations which would consume unnecessary resources when manipulated through state via redux etc.
const bindDirectMapEventing = (map) => {
  setDirectMapBindingsForFeatureHighlightStates(map);
};

const App = (props) => {
  const { fetchMaps, fetchEventTypes, fetchEventSchema, fetchAnalyzers, fetchPatrolTypes, fetchSubjectGroups, fetchFeaturesets, fetchSystemStatus, pickingLocationOnMap,
    sidebarOpen, trackLength, setTrackLength, setDefaultCustomTrackLength, setSeenSplashWarningMessage, showGeoPermWarningMessage } = props;
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


  useEffect(() => {
    console.log('THE APP HAS BEGUN');
    /* use these catch blocks to provide error toasts if/as desired */
    fetchEventTypes();
    fetchEventSchema();
    fetchMaps();
    fetchSubjectGroups();
    fetchAnalyzers();
    fetchSystemStatus()
      .then(({ patrol_enabled, track_length }) => {
        if (patrol_enabled) {
          fetchPatrolTypes();
        }
        if (track_length) {
          const { defaultCustomTrackLength, length } = trackLength;
          if (defaultCustomTrackLength === undefined || defaultCustomTrackLength === length) {
            setTrackLength(track_length);
            setDefaultCustomTrackLength(track_length);
          } else if (track_length !== defaultCustomTrackLength) {
            setDefaultCustomTrackLength(track_length);
          }
        }
      });

    loadProgressBar();

    initZenDesk();
    hideZenDesk();

  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  useEffect(() => {
    if (showGeoPermWarningMessage) {
      const toastId = showToast({
        message: 'Some data will only be displayed when you are near its location.',
        // details: ' asdf a4r asd fa4ofi ads faq4r fashdf a4r aoiernfd ',
        // link: { href: 'https://earthranger.com', title: 'click it fuckhead' },
        toastConfig: { type: toast.TYPE.INFO, autoClose: false, onClose() {
          setSeenSplashWarningMessage(new Date().toISOString());
        } } });

      return () => {
        toast.dismiss(toastId);
      };
    }
  }, [showGeoPermWarningMessage, setSeenSplashWarningMessage]);

  return <div className={`App ${isDragging ? 'dragging' : ''} ${pickingLocationOnMap ? 'picking-location' : ''}`} onDragLeave={finishDrag} onDragOver={disallowDragAndDrop} onDrop={disallowDragAndDrop}> {/* eslint-disable-line react/jsx-no-duplicate-props */}
    <MapContext.Provider value={map}>
      <PrintTitle />

      <Nav map={map} />

      <div className={`app-container ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Map map={map} onMapLoad={onMapHasLoaded} socket={socket} pickingLocationOnMap={pickingLocationOnMap} />
        {!!map && <SideBar map={map} />}
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

      <Drawer />

      <ServiceWorkerWatcher />
    </MapContext.Provider>
    <ToastContainer />
  </div>;
};

const mapStateToProps = ({ view: { userLocation, trackLength, geoPermMessageTimestamps: { lastSeenSplashWarning }, userPreferences: { sidebarOpen }, pickingLocationOnMap }, data: { user } }) => {
  const geoPermRestricted = userIsGeoPermissionRestricted(user);

  return {
    trackLength,
    pickingLocationOnMap,
    sidebarOpen,
    lastSeenGeoPermSplashWarning: null,
    showGeoPermWarningMessage: !!userLocation && geoPermRestricted && geoPermWarningSplashToastIsDueToBeShown(lastSeenSplashWarning),
    userIsGeoPermissionRestricted: geoPermRestricted,
  };
};

export const ConnectedApp = connect(mapStateToProps, { fetchMaps, fetchEventSchema, fetchFeaturesets, fetchAnalyzers, fetchPatrolTypes, fetchEventTypes, fetchSubjectGroups, fetchSystemStatus, updateUserPreferences, setTrackLength, setSeenSplashWarningMessage, setDefaultCustomTrackLength })(memo(App));


const AppWithSocketContext = () => <WithSocketContext>
  <ConnectedApp />
</WithSocketContext>;

export default AppWithSocketContext;
