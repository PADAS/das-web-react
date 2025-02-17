import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { loadProgressBar } from 'axios-progress-bar';
import { Slide, toast, ToastContainer } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';

import { ReactComponent as EarthRangerLogoSprite } from './common/images/sprites/logo-svg-sprite.svg';
import { ReactComponent as ReportTypeIconSprite } from './common/images/sprites/event-svg-sprite.svg';

import { fetchAnalyzers } from './ducks/analyzers';
import { fetchEventCategories } from './ducks/event-categories';
import { fetchEventsSchema } from './ducks/event-schemas';
import { fetchEventTypes } from './ducks/event-types';
import { fetchFeaturesets } from './ducks/features';
import { fetchMaps } from './ducks/maps';
import { fetchPatrolTypes } from './ducks/patrol-types';
import { fetchSubjectGroups } from './ducks/subjects';
import { fetchSystemStatus } from './ducks/system-status';
import { getCurrentTabFromURL } from './utils/navigation';
import { setDefaultCustomTrackLength, setTrackLength } from './ducks/tracks';
import { showToast } from './utils/toast';
import useNavigate from './hooks/useNavigate';
import { userIsGeoPermissionRestricted } from './utils/geo-perms';

import Drawer from './Drawer';
import Map from './Map';
import MapDrawingToolsContextProvider from './MapDrawingTools/ContextProvider';
import ModalRenderer from './ModalRenderer';
import Nav from './Nav';
import PrintTitle from './PrintTitle';
import ServiceWorkerWatcher from './ServiceWorkerWatcher';
import SideBar from './SideBar';
import { SidebarScrollProvider } from './SidebarScrollContext';
import WithSocketContext, { SocketContext } from './withSocketConnection';

import 'axios-progress-bar/dist/nprogress.css';
import './App.scss';

export const MapContext = createContext(null);

export const App = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const homeMap = useSelector((state) => state.view.homeMap);
  const mapLocationSelection = useSelector((state) => state.view.mapLocationSelection);
  const mapPosition = useSelector((state) => state.data.mapPosition);
  const showGeoPermWarningMessage = useSelector(
    (state) => !!state.view.userLocation && userIsGeoPermissionRestricted(state.data.user)
  );
  const trackLength = useSelector((state) => state.view.trackLength);

  const socket = useContext(SocketContext);

  const [isDragging, setDragState] = useState(false);
  const [map, setMap] = useState(null);

  const currentTab = getCurrentTabFromURL(location.pathname);
  let sidebarOpen = !!currentTab;

  const jumpToStartingLocation = useCallback((map) => {
    const lnglat = new URLSearchParams(location.search).get('lnglat');

    if (lnglat) {
      const lngLatFromParams = lnglat.replace(' ', '').split(',').map((n) => parseFloat(n));
      const newLocation = { ...location };
      delete newLocation.search;

      navigate(newLocation, { replace: true, state: { comesFromLngLatRedirection: true } });

      map.jumpTo({ center: lngLatFromParams, zoom: 16 });
    } else if (homeMap && !mapPosition?.center && !mapPosition?.zoom) {
      map.jumpTo({ center: homeMap.center, zoom: homeMap.zoom });
    }
  }, [homeMap, location, mapPosition, navigate]);

  const onMapHasLoaded = useCallback((map) => {
    setMap(map);
    jumpToStartingLocation(map);
    dispatch(fetchFeaturesets());
  }, [dispatch, jumpToStartingLocation]);

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
    dispatch(fetchEventTypes());
    dispatch(fetchEventCategories());
    dispatch(fetchEventsSchema());
    dispatch(fetchMaps());
    dispatch(fetchSubjectGroups());
    dispatch(fetchAnalyzers());
    dispatch(fetchSystemStatus())
      .then((results = {}) => {
        if (results.patrol_enabled) {
          dispatch(fetchPatrolTypes());
        }
        if (results.track_length) {
          const { track_length } = results;
          const { defaultCustomTrackLength, length } = trackLength;
          if (defaultCustomTrackLength === undefined || defaultCustomTrackLength === length) {
            dispatch(setTrackLength(track_length));
            dispatch(setDefaultCustomTrackLength(track_length));
          } else if (track_length !== defaultCustomTrackLength) {
            dispatch(setDefaultCustomTrackLength(track_length));
          }
        }
      });

    loadProgressBar({}, axios);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (showGeoPermWarningMessage) {
      // TODO: Missing i18n
      const toastId = showToast({
        message: 'Some data may only be displayed when you are near its location.',
        toastConfig: {
          autoClose: false,
          type: 'info',
          onClose: () => {},
        },
      });

      return () => toast.dismiss(toastId);
    }
  }, [showGeoPermWarningMessage]);

  const mapLocationSelectionModeClass = mapLocationSelection.isPickingLocation ? 'picking-location-fullscreen' : '';

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

          {!!map && <SidebarScrollProvider>
            <SideBar map={map} />
          </SidebarScrollProvider>}

          <ModalRenderer />
        </div>

        <div style={{ display: 'none', height: 0, width: 0 }}>
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

const AppWithSocketContext = () => <WithSocketContext>
  <App />
</WithSocketContext>;

export default AppWithSocketContext;
