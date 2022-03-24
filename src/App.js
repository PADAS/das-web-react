import React, { createContext, memo, useCallback, useEffect, useContext, useState } from 'react';
import Map from './Map';
import Nav from './Nav';
import { connect } from 'react-redux';
import { loadProgressBar } from 'axios-progress-bar';
import { ToastContainer, toast } from 'react-toastify';
import 'axios-progress-bar/dist/nprogress.css';

import { fetchMaps } from './ducks/maps';
import { setDirectMapBindingsForFeatureHighlightStates } from './utils/features';
import { userIsGeoPermissionRestricted } from './utils/geo-perms';
import { DEVELOPMENT_FEATURE_FLAGS } from './constants';
import { fetchSystemStatus } from './ducks/system-status';
import { fetchEventTypes } from './ducks/event-types';
import { updateUserPreferences } from './ducks/user-preferences';
import { setTrackLength, setDefaultCustomTrackLength } from './ducks/tracks';
import { fetchSubjectGroups } from './ducks/subjects';
import { fetchFeaturesets } from './ducks/features';
import { fetchAnalyzers } from './ducks/analyzers';
import { fetchPatrolTypes } from './ducks/patrol-types';
import { fetchEventSchema } from './ducks/event-schemas';
import { trackEventFactory, DRAWER_CATEGORY } from './utils/analytics';

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
const { UFA_NAVIGATION_UI } = DEVELOPMENT_FEATURE_FLAGS;

export const MapContext = createContext(null);

// use this block to do direct map event binding.
// useful for API gaps between react-mapbox-gl and mapbox-gl.
// also useful for presentation manipulations which would consume unnecessary resources when manipulated through state via redux etc.
const bindDirectMapEventing = (map) => {
  setDirectMapBindingsForFeatureHighlightStates(map);
};

const App = (props) => {
  const { fetchMaps, fetchEventTypes, fetchEventSchema, fetchAnalyzers, fetchPatrolTypes, fetchSubjectGroups, fetchFeaturesets, fetchSystemStatus, pickingLocationOnMap,
    sidebarOpen, trackLength, setTrackLength, updateUserPreferences, setDefaultCustomTrackLength, showGeoPermWarningMessage } = props;
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
    drawerTracker.track(`${sidebarOpen ? 'Close' : 'open'} Drawer`, null);
  }, [sidebarOpen, updateUserPreferences]);

  useEffect(() => {
    /* use these catch blocks to provide error toasts if/as desired */
    fetchEventTypes();
    fetchEventSchema();
    fetchMaps();
    fetchSubjectGroups();
    fetchAnalyzers();
    fetchSystemStatus()
      .then((results = {}) => {
        if (results.patrol_enabled) {
          fetchPatrolTypes();
        }
        if (results.track_length) {
          const { track_length } = results;
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

  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  useEffect(() => {
    if (showGeoPermWarningMessage) {
      const toastId = showToast({
        message: 'Some data may only be displayed when you are near its location.',
        // details: ' asdf a4r asd fa4ofi ads faq4r fashdf a4r aoiernfd ',
        // link: { href: 'https://earthranger.com', title: 'click it fuckhead' },
        toastConfig: { type: toast.TYPE.INFO, autoClose: false, onClose() {
        } } });

      return () => {
        toast.dismiss(toastId);
      };
    }
  }, [showGeoPermWarningMessage]);

  return <div
    className={`App ${isDragging ? 'dragging' : ''} ${pickingLocationOnMap ? 'picking-location' : ''} ${UFA_NAVIGATION_UI ? '' : 'oldNavigation'}`}
    onDragLeave={finishDrag}
    onDragOver={disallowDragAndDrop}
    onDrop={disallowDragAndDrop} // eslint-disable-line react/jsx-no-duplicate-props
    >
    <MapContext.Provider value={map}>
      <PrintTitle />

      <Nav map={map} />

      <div className={`app-container ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Map map={map} onMapLoad={onMapHasLoaded} socket={socket} pickingLocationOnMap={pickingLocationOnMap} />
        {!!map && <SideBar {...(UFA_NAVIGATION_UI ? {} : { onHandleClick: onSidebarHandleClick })} map={map} />}
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

const mapStateToProps = ({ view: { trackLength, userPreferences: { sidebarOpen }, pickingLocationOnMap }, data: { user } }) => {
  const geoPermRestricted = userIsGeoPermissionRestricted(user);

  return {
    trackLength,
    pickingLocationOnMap,
    sidebarOpen,
    lastSeenGeoPermSplashWarning: null,
    showGeoPermWarningMessage: geoPermRestricted,
    userIsGeoPermissionRestricted: geoPermRestricted,
  };
};

export const ConnectedApp = connect(mapStateToProps, { fetchMaps, fetchEventSchema, fetchFeaturesets, fetchAnalyzers, fetchPatrolTypes, fetchEventTypes, fetchSubjectGroups, fetchSystemStatus, updateUserPreferences, setTrackLength, setDefaultCustomTrackLength })(memo(App));


const AppWithSocketContext = () => <WithSocketContext>
  <ConnectedApp />
</WithSocketContext>;

export default AppWithSocketContext;
