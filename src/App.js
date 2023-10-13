import React, { createContext, memo, useCallback, useEffect, useContext, useState } from 'react';
import axios from 'axios';

import Map from './Map';
import Nav from './Nav';
import { connect } from 'react-redux';
import { loadProgressBar } from 'axios-progress-bar';
import { ToastContainer, toast, Slide } from 'react-toastify';
import { useLocation } from 'react-router-dom';
import 'axios-progress-bar/dist/nprogress.css';

import { fetchMaps } from './ducks/maps';
import { userIsGeoPermissionRestricted } from './utils/geo-perms';
import { fetchSystemStatus } from './ducks/system-status';
import { fetchEventTypes } from './ducks/event-types';
import { setTrackLength, setDefaultCustomTrackLength } from './ducks/tracks';
import { fetchSubjectGroups } from './ducks/subjects';
import { fetchFeaturesets } from './ducks/features';
import { fetchAnalyzers } from './ducks/analyzers';
import { fetchPatrolTypes } from './ducks/patrol-types';
import { fetchEventSchema } from './ducks/event-schemas';
import { getCurrentTabFromURL } from './utils/navigation';
import MapDrawingToolsContextProvider from './MapDrawingTools/ContextProvider';

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
import { SidebarScrollContext } from './SidebarScrollContext';

export const MapContext = createContext(null);

const App = (props) => {
  const {
    fetchMaps,
    fetchEventTypes,
    fetchEventSchema,
    fetchAnalyzers,
    fetchPatrolTypes,
    fetchSubjectGroups,
    fetchFeaturesets,
    fetchSystemStatus,
    mapLocationSelection,
    trackLength,
    setTrackLength,
    setDefaultCustomTrackLength,
    showGeoPermWarningMessage,
  } = props;

  const location = useLocation();

  const currentTab = getCurrentTabFromURL(location.pathname);
  let sidebarOpen = !!currentTab;

  const [map, setMap] = useState(null);

  const [isDragging, setDragState] = useState(false);

  const socket = useContext(SocketContext);

  const onMapHasLoaded = useCallback((map) => {
    setMap(map);
    fetchFeaturesets();
  }, [fetchFeaturesets]);

  const disallowDragAndDrop = useCallback((e) => {
    setDragState(true);
    e.preventDefault();
  }, []);

  const finishDrag = useCallback(() => {
    setDragState(false);
  }, []);

  const onDrop = useCallback((e) => {
    disallowDragAndDrop(e);
    finishDrag(e);
  }, [disallowDragAndDrop, finishDrag]);

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

    loadProgressBar({}, axios);

  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showGeoPermWarningMessage) {
      const toastId = showToast({
        message: 'Some data may only be displayed when you are near its location.',
        toastConfig: { type: toast.TYPE.INFO, autoClose: false, onClose() {
        } } });

      return () => {
        toast.dismiss(toastId);
      };
    }
  }, [showGeoPermWarningMessage]);

  const mapLocationSelectionModeClass = mapLocationSelection.isPickingLocation
    ? 'picking-location-fullscreen'
    : '';

  return <div
    className={`App ${isDragging ? 'dragging' : ''} ${mapLocationSelectionModeClass}`}
    data-testid="app-wrapper"
    onDrop={onDrop}
    onDragLeave={finishDrag}
    onDragOver={disallowDragAndDrop}
    >
    <MapContext.Provider value={map}>
      <MapDrawingToolsContextProvider>
        <PrintTitle />

        <Nav map={map} />

        <div className={`app-container ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <Map map={map} onMapLoad={onMapHasLoaded} socket={socket} />
          {!!map && <SidebarScrollContext>
            <SideBar map={map} />
          </SidebarScrollContext>
          }
          <ModalRenderer />
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
      </MapDrawingToolsContextProvider>
    </MapContext.Provider>
    <ToastContainer transition={Slide} />
  </div>;
};

const mapStateToProps = ({
  view: { trackLength, mapLocationSelection, userLocation },
  data: { user } },
) => {
  const geoPermRestricted = userIsGeoPermissionRestricted(user);

  return {
    trackLength,
    mapLocationSelection,
    lastSeenGeoPermSplashWarning: null,
    showGeoPermWarningMessage: !!userLocation && geoPermRestricted,
    userIsGeoPermissionRestricted: geoPermRestricted,
  };
};

export const ConnectedApp = connect(mapStateToProps, { fetchMaps, fetchEventSchema, fetchFeaturesets, fetchAnalyzers, fetchPatrolTypes, fetchEventTypes, fetchSubjectGroups, fetchSystemStatus, setTrackLength, setDefaultCustomTrackLength })(memo(App));


const AppWithSocketContext = () => <WithSocketContext>
  <ConnectedApp />
</WithSocketContext>;

export default AppWithSocketContext;
