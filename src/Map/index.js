import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { RotationControl } from 'react-mapbox-gl';
import { connect } from 'react-redux';
import uniq from 'lodash/uniq';
import uniqBy from 'lodash/uniqBy';
import xor from 'lodash/xor';
import debounce from 'lodash/debounce';
import { CancelToken } from 'axios';
import differenceInCalendarDays from 'date-fns/difference_in_calendar_days';

import { clearSubjectData, fetchMapSubjects, mapSubjectsFetchCancelToken } from '../ducks/subjects';
import { clearEventData, fetchMapEvents, cancelMapEventsFetch } from '../ducks/events';
import { fetchBaseLayers } from '../ducks/layers';
import { TRACK_LENGTH_ORIGINS, setTrackLength } from '../ducks/tracks';
import { showPopup, hidePopup } from '../ducks/popup';
import { cleanUpBadlyStoredValuesFromMapSymbolLayer, jumpToLocation } from '../utils/map';
import { setAnalyzerFeatureActiveStateForIDs } from '../utils/analyzers';
import { getPatrolsForLeaderId } from '../utils/patrols';
import { openModalForReport } from '../utils/events';
import { calcLocationParamStringForUserLocationCoords } from '../utils/location';
import { calcEventFilterForRequest } from '../utils/event-filter';
import { calcPatrolFilterForRequest } from '../utils/patrol-filter';
import { fetchTracksIfNecessary } from '../utils/tracks';
import { subjectIsStatic } from '../utils/subjects';
import { getFeatureSetFeatureCollectionsByType } from '../selectors';
import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../selectors/subjects';
import { trackEventFactory, MAP_INTERACTION_CATEGORY } from '../utils/analytics';
import { findAnalyzerIdByChildFeatureId, getAnalyzerFeaturesAtPoint } from '../utils/analyzers';
import { getCurrentTabFromURL } from '../utils/navigation';
import { analyzerFeatures, getAnalyzerFeatureCollectionsByType } from '../selectors';
import {
  updateTrackState,
  updateHeatmapSubjects,
  setReportHeatmapVisibility,
} from '../ducks/map-ui';
import { addModal } from '../ducks/modals';
import { updatePatrolTrackState } from '../ducks/patrols';
import { addUserNotification } from '../ducks/user-notifications';
import useNavigate from '../hooks/useNavigate';

import {
  DEVELOPMENT_FEATURE_FLAGS,
  LAYER_IDS,
  LAYER_PICKER_IDS,
  MAX_ZOOM,
  TAB_KEYS,
} from '../constants';

import DelayedUnmount from '../DelayedUnmount';
import EarthRangerMap, { withMap } from '../EarthRangerMap';
import EventsLayer from '../EventsLayer';
import SubjectsLayer from '../SubjectsLayer';
import StaticSensorsLayer from '../StaticSensorsLayer';
import TrackLayers from '../TracksLayer';
import PatrolStartStopLayer from '../PatrolStartStopLayer';
import FeatureLayer from '../FeatureLayer';
import AnalyzerLayer from '../AnalyzersLayer';
import PopupLayer from '../PopupLayer';
import SubjectHeatLayer from '../SubjectHeatLayer';
import UserCurrentLocationLayer from '../UserCurrentLocationLayer';
import SubjectHeatmapLegend from '../SubjectHeatmapLegend';
import SubjectTrackLegend from '../SubjectTrackLegend';
import PatrolTrackLegend from '../PatrolTrackLegend';
import EventFilter from '../EventFilter';
import TimeSlider from '../TimeSlider';
import TimeSliderMapControl from '../TimeSlider/TimeSliderMapControl';
import ReportsHeatLayer from '../ReportsHeatLayer';
import ReportsHeatmapLegend from '../ReportsHeatmapLegend';
import MessageBadgeLayer from '../MessageBadgeLayer';
import MapImagesLayer from '../MapImagesLayer';
import ReloadOnProfileChange from '../ReloadOnProfileChange';
import SleepDetector from '../SleepDetector';
import ClustersLayer from '../ClustersLayer';

import AddReport from '../AddReport';
import MapRulerControl from '../MapRulerControl';
import MapPrintControl from '../MapPrintControl';
import MapMarkerDropper from '../MapMarkerDropper';
import MapBaseLayerControl from '../MapBaseLayerControl';
import MapSettingsControl from '../MapSettingsControl';
import PatrolTracks from '../PatrolTracks';
import CursorGpsDisplay from '../CursorGpsDisplay';
import RightClickMarkerDropper from '../RightClickMarkerDropper';

import './Map.scss';
import { userIsGeoPermissionRestricted } from '../utils/geo-perms';

const {
  ENABLE_REPORT_NEW_UI,
} = DEVELOPMENT_FEATURE_FLAGS;

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const CLUSTER_APPROX_WIDTH = 40;
const CLUSTER_APPROX_HEIGHT = 25;

const { EVENT_CLUSTERS_CIRCLES, SUBJECT_SYMBOLS } = LAYER_IDS;

const Map = ({
  analyzersFeatureCollection,
  analyzerFeatures,
  bounceEventIDs,
  children,
  clearEventData,
  clearSubjectData,
  eventFilter,
  fetchBaseLayers,
  fetchMapEvents,
  fetchMapSubjects,
  heatmapSubjectIDs,
  hiddenAnalyzerIDs,
  hiddenFeatureIDs,
  hidePopup,
  homeMap,
  map,
  mapFeaturesFeatureCollection,
  mapImages,
  mapIsLocked,
  maps,
  mapSubjectFeatureCollection,
  onMapLoad,
  patrolFilter,
  patrolTrackState,
  pickingLocationOnMap,
  popup,
  setReportHeatmapVisibility,
  setTrackLength,
  showPopup,
  showReportHeatmap,
  showReportsOnMap,
  showTrackTimepoints,
  socket,
  subjectTrackState,
  timeSliderState,
  trackLength,
  trackLengthOrigin,
  updateHeatmapSubjects,
  updatePatrolTrackState,
  updateTrackState,
  user,
  userLocation,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentTab = getCurrentTabFromURL(location.pathname);

  const trackRequestCancelToken = useRef(CancelToken.source());
  const lngLatFromParams = useRef();

  useEffect(() => {
    const lnglat = new URLSearchParams(location.search).get('lnglat');
    if (lnglat) {
      lngLatFromParams.current = lnglat.replace(' ', '').split(',').map(n => parseFloat(n));
      const newLocation = { ...location };

      delete newLocation.search;
      navigate(newLocation);
    }
  }, [location, navigate]);

  const [currentAnalyzerIds, setCurrentAnalyzerIds] = useState([]);

  const { symbolFeatures, lineFeatures, fillFeatures } = mapFeaturesFeatureCollection;

  const {
    analyzerWarningLines,
    analyzerCriticalLines,
    analyzerWarningPolys,
    analyzerCriticalPolys,
    layerGroups,
  } = analyzersFeatureCollection;

  const subjectHeatmapAvailable = !!heatmapSubjectIDs.length;
  const subjectTracksVisible = !!subjectTrackState.pinned.length || !!subjectTrackState.visible.length;
  const patrolTracksVisible = !!patrolTrackState.pinned.length || !!patrolTrackState.visible.length;

  const onReportMarkerDrop = useCallback((location) => {
    const coordinates = [location.lng, location.lat];
    showPopup('dropped-marker', { location, coordinates });
  }, [showPopup]);

  const onMapMoveStart = useCallback(() => {
    mapSubjectsFetchCancelToken.cancel();
    cancelMapEventsFetch();
  }, []);

  const fetchMapEventsFromLocation = useCallback(() => {
    let params;
    if (userLocation?.coords) {
      params = { location: calcLocationParamStringForUserLocationCoords(userLocation.coords) };
    }
    return fetchMapEvents(map, params).catch((e) => console.warn('error fetching map events', e));
  }, [fetchMapEvents, map, userLocation?.coords]);

  const resetTrackRequestCancelToken = useCallback(() => {
    trackRequestCancelToken.current.cancel();
    trackRequestCancelToken.current = CancelToken.source();
  }, []);

  const fetchMapSubjectTracksForTimeslider = useCallback((subjects) => {
    resetTrackRequestCancelToken();
    return fetchTracksIfNecessary(subjects
      .filter(subject => !subjectIsStatic(subject))
      .filter(({ last_position_date }) =>
        (new Date(last_position_date) - new Date(eventFilter.filter.date_range.lower) >= 0))
      .map(({ id }) => id));
  }, [eventFilter.filter.date_range.lower, resetTrackRequestCancelToken]);

  const fetchMapSubjectsFromTimeslider = useCallback(() => {
    const args = [map];
    const timeSliderActive = timeSliderState.active;

    if (timeSliderActive) {
      const { lower: updated_since, upper: updated_until } = eventFilter.filter.date_range;

      args.push({ updated_since, updated_until });
    }

    return fetchMapSubjects(...args)
      .then((latestMapSubjects) => timeSliderActive
        ? fetchMapSubjectTracksForTimeslider(latestMapSubjects)
        : Promise.resolve(latestMapSubjects))
      .catch(() => {});
  }, [
    eventFilter.filter.date_range,
    fetchMapSubjectTracksForTimeslider,
    fetchMapSubjects,
    map,
    timeSliderState.active,
  ]);

  const fetchMapData = useCallback(() => {
    onMapMoveStart();

    return Promise.all([fetchMapEventsFromLocation(), fetchMapSubjectsFromTimeslider()])
      .catch((e) => console.warn('error loading map data', e))
      .finally(() => {});
  }, [fetchMapEventsFromLocation, fetchMapSubjectsFromTimeslider, onMapMoveStart]);

  const debouncedFetchMapData = debounce(fetchMapData, 500);

  const debouncedFetchMapEvents = debounce(fetchMapEventsFromLocation, 300);

  const onMapMoveEnd = useCallback(() => {
    debouncedFetchMapData();
  }, [debouncedFetchMapData]);

  const onMapZoom = debounce(() => {
    if (popup?.type === 'multi-layer-select') {
      hidePopup(popup.id);
    }
  }, 100);

  const withLocationPickerState = useCallback((func) => (...args) => {
    if (!pickingLocationOnMap) {
      return func(...args);
    }
  }, [pickingLocationOnMap]);

  const onMapSubjectClick = withLocationPickerState(async ({ event, layer }) => {
    if (event?.originalEvent?.cancelBubble) return;

    const { geometry, properties } = layer;
    const { id, tracks_available } = properties;

    showPopup('subject', { geometry, properties, coordinates: geometry.coordinates });

    await tracks_available ? fetchTracksIfNecessary([id]) : new Promise(resolve => resolve());

    if (tracks_available) {
      updateTrackState({ visible: [...subjectTrackState.visible, id] });
    }

    mapInteractionTracker.track('Click Map Subject Icon', `Subject Type:${properties.subject_type}`);
  });

  const onEventSymbolClick = withLocationPickerState(({ event: clickEvent, layer: { properties } }) => {
    if (clickEvent?.originalEvent?.cancelBubble) return;

    const event = cleanUpBadlyStoredValuesFromMapSymbolLayer(properties);

    mapInteractionTracker.track('Click Map Event Icon', `Event Type:${event.event_type}`);

    if (ENABLE_REPORT_NEW_UI) {
      navigate(`/${TAB_KEYS.REPORTS}/${event.id}`);
    } else {
      openModalForReport(event, map);
    }
  });

  const handleMultiFeaturesAtSameLocationClick = useCallback((event, layers) => {
    showPopup('multi-layer-select', {
      layers,
      coordinates: [event.lngLat.lng, event.lngLat.lat],
      onSelectSubject: onMapSubjectClick,
      onSelectEvent: onEventSymbolClick,
    });
  }, [onEventSymbolClick, onMapSubjectClick, showPopup]);

  const hideUnpinnedTrackLayers = useCallback((map, event) => {
    const { visible } = subjectTrackState;
    const { visible: visiblePatrolIds } = patrolTrackState;

    if (!visible.length) return;

    const clickedLayerIDs = map.queryRenderedFeatures(event.point)
      .filter(({ properties }) => !!properties && properties.id)
      .map(({ properties: { id } }) => id);

    const matchingPatrolIds = clickedLayerIDs
      .reduce((accumulator, id) => [...accumulator, ...getPatrolsForLeaderId(id)], [])
      .map(({ id }) => id);

    updateTrackState({ visible: visible.filter(id => clickedLayerIDs.includes(id)) });
    updatePatrolTrackState({ visible: visiblePatrolIds.filter(id => matchingPatrolIds.includes(id)) });
  }, [patrolTrackState, subjectTrackState, updatePatrolTrackState, updateTrackState]);

  const setMap = useCallback((map) => {
    // don't set zoom if not hydrated
    if (homeMap && homeMap.zoom) {
      if (lngLatFromParams.current) {
        map.setZoom(16);
      } else {
        map.setZoom(homeMap.zoom);
      }
    };
    window.map = map;

    onMapLoad(map);
    debouncedFetchMapData();
  }, [debouncedFetchMapData, homeMap, onMapLoad]);

  const onShowClusterSelectPopup = useCallback((layers, coordinates) => {
    showPopup('cluster-select', {
      layers,
      coordinates,
      onSelectEvent: onEventSymbolClick,
      onSelectSubject: onMapSubjectClick,
    });
  }, [onEventSymbolClick, onMapSubjectClick, showPopup]);

  const onClusterClick = withLocationPickerState(({ point }) => {
    const features = map.queryRenderedFeatures(point, { layers: [EVENT_CLUSTERS_CIRCLES] });
    const clusterId = features[0].properties.cluster_id;
    const clusterSource = map.getSource('events-data-clustered');

    clusterSource.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;

      const mapZoom = map.getZoom();
      const newMapZoom = (zoom > MAX_ZOOM) ? MAX_ZOOM : zoom;

      if (mapZoom < MAX_ZOOM && mapZoom < zoom) {
        map.easeTo({ center: features[0].geometry.coordinates, zoom: newMapZoom });
      }
    });
  });

  const onCurrentUserLocationClick = withLocationPickerState((location) => {
    showPopup('current-user-location', {
      location,
      coordinates: [location.coords.longitude, location.coords.latitude],
    });
    mapInteractionTracker.track('Click Current User Location Icon');
  });

  const onMessageBadgeClick = withLocationPickerState(({ layer }) => {
    const { geometry, properties } = layer;

    showPopup('subject-messages', { geometry, properties, coordinates: geometry.coordinates });
  });

  const onTrackLegendClose = useCallback(() =>  {
    updateTrackState({ visible: [], pinned: [] });
  }, [updateTrackState]);

  const onSubjectHeatmapClose = useCallback(() => {
    updateHeatmapSubjects([]);
  }, [updateHeatmapSubjects]);

  const onCloseReportHeatmap = useCallback(()  => {
    setReportHeatmapVisibility(false);
  }, [setReportHeatmapVisibility]);

  const onPatrolTrackLegendClose = useCallback(() => {
    updatePatrolTrackState({ visible: [], pinned: [] });
  }, [updatePatrolTrackState]);

  const onRotationControlClick = useCallback(() => {
    map.easeTo({ bearing: 0, pitch: 0 });
  }, [map]);

  const onTimepointClick = withLocationPickerState((layer) => {
    const { geometry, properties } = layer;
    showPopup('timepoint', { geometry, properties, coordinates: geometry.coordinates });
  });

  const onFeatureSymbolClick = withLocationPickerState(({ geometry, properties }) => {
    const coordinates = Array.isArray(geometry.coordinates[0]) ? geometry.coordinates[0] : geometry.coordinates;

    showPopup('feature-symbol', { geometry, properties, coordinates });
    mapInteractionTracker.track('Click Map Feature Symbol Icon', `Feature ID :${properties.id}`);
  });

  const onAnalyzerGroupEnter = useCallback((e, groupIds) => {
    // if an analyzer popup is open, and the user selects a new analyzer, dismiss the current pop.
    if (xor(groupIds, currentAnalyzerIds).length !== 0) {
      if (popup?.type === 'analyzer-config') {
        hidePopup(popup.id);
      }
    }
    setAnalyzerFeatureActiveStateForIDs(map, currentAnalyzerIds, false);
    setCurrentAnalyzerIds(groupIds);
    setAnalyzerFeatureActiveStateForIDs(map, groupIds, true);
  }, [currentAnalyzerIds, hidePopup, map, popup?.id, popup?.type]);

  const onAnalyzerGroupExit = useCallback((e, groupIds) => {
    // shortcircuit when the analyzer popup is displayed
    if (popup?.type === 'analyzer-config') return;
    setAnalyzerFeatureActiveStateForIDs(map, groupIds, false);
  }, [map, popup?.type]);

  const onAnalyzerFeatureClick = withLocationPickerState((e) => {
    const features = getAnalyzerFeaturesAtPoint(map, e.point);
    setAnalyzerFeatureActiveStateForIDs(map, currentAnalyzerIds, true);
    const properties = features[0].properties;
    const geometry = e.lngLat;
    const analyzerId = findAnalyzerIdByChildFeatureId(properties.id, analyzerFeatures);

    showPopup('analyzer-config', { geometry, properties, analyzerId, coordinates: geometry });
  });

  const onSleepDetected = useCallback(() => {
    debouncedFetchMapData();
  }, [debouncedFetchMapData]);

  const onMapClick = withLocationPickerState((map, event) => {
    const clickedLayersOfInterest = uniqBy(
      map.queryRenderedFeatures(
        event.point,
        { layers: LAYER_PICKER_IDS.filter(id => !!map.getLayer(id)) }
      ),
      layer => layer.properties.id
    );
    let shouldHidePopup = true, clusterFeaturesAtPoint = [];

    const clusterApproxGeometry = [
      [event.point.x - CLUSTER_APPROX_WIDTH, event.point.y + CLUSTER_APPROX_HEIGHT],
      [event.point.x + CLUSTER_APPROX_WIDTH, event.point.y - CLUSTER_APPROX_HEIGHT]
    ];
    const clustersAtPoint = map.queryRenderedFeatures(
      clusterApproxGeometry,
      { layers: [LAYER_IDS.CLUSTERS_LAYER_ID] }
    );

    shouldHidePopup = !clustersAtPoint.length;

    if (!!clusterFeaturesAtPoint.length || clickedLayersOfInterest.length > 1) { /* only propagate click events when not on clusters or areas which require disambiguation */
      event.originalEvent.cancelBubble = true;
    }

    if (clickedLayersOfInterest.length > 1) {
      if (!clusterFeaturesAtPoint.length) {  /* cluster clicks take precendence over disambiguation popover */
        handleMultiFeaturesAtSameLocationClick(event, clickedLayersOfInterest);
        shouldHidePopup = false;
      }
    }

    if (popup) {
      // be sure to also deactivate the analyzer features when dismissing an analyzer popup
      if (popup.type === 'analyzer-config') {
        setAnalyzerFeatureActiveStateForIDs(map, currentAnalyzerIds, false);
      }
      if (shouldHidePopup) {
        hidePopup(popup.id);
      }
    }

    hideUnpinnedTrackLayers(map, event);
  });

  // Workaround to lame issue with React Mapbox GL: https://github.com/alex3165/react-mapbox-gl/issues/963
  const onMoveStartRef = useRef(onMapMoveStart);
  const onMoveEndRef = useRef(onMapMoveEnd);
  const onZoomRef = useRef(onMapZoom);
  const onMapClickRef = useRef(onMapClick);
  const onMapLoadedRef = useRef(setMap);

  useEffect(() => { onMoveStartRef.current = onMapMoveStart; }, [onMapMoveStart]);
  useEffect(() => { onMoveEndRef.current = onMapMoveEnd; }, [onMapMoveEnd]);
  useEffect(() => { onZoomRef.current = onMapZoom; }, [onMapZoom]);
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { onMapLoadedRef.current = setMap; }, [setMap]);

  const setTrackLengthToEventFilterLowerValue = useCallback(() => {
    setTrackLength(differenceInCalendarDays(new Date(), eventFilter.filter.date_range.lower));
  }, [eventFilter.filter.date_range.lower, setTrackLength]);

  const onTrackLengthChange = useCallback(() => {
    resetTrackRequestCancelToken();
    fetchTracksIfNecessary(uniq([...subjectTrackState.visible, ...subjectTrackState.pinned, ...heatmapSubjectIDs]));
  }, [heatmapSubjectIDs, resetTrackRequestCancelToken, subjectTrackState.pinned, subjectTrackState.visible]);

  useEffect(() => {
    fetchBaseLayers();
    if (trackLengthOrigin === TRACK_LENGTH_ORIGINS.eventFilter) {
      setTrackLengthToEventFilterLowerValue();
    }

    return () => {
      clearEventData();
      clearSubjectData(); // map data cleanup
    };
  }, [clearEventData, clearSubjectData, fetchBaseLayers, setTrackLengthToEventFilterLowerValue, trackLengthOrigin]);

  useEffect(() => {
    if (!!map) {
      const { zoom, center } = homeMap;
      jumpToLocation(map, lngLatFromParams.current || center, zoom);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeMap, map]);

  useEffect(() => {
    if (!!map) {
      socket.emit('event_filter', calcEventFilterForRequest({ format: 'object' }));
      if (trackLengthOrigin === TRACK_LENGTH_ORIGINS.eventFilter) {
        setTrackLengthToEventFilterLowerValue();
      }
      debouncedFetchMapEvents();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventFilter, map]);

  useEffect(() => {
    if (!!map) {
      socket.emit('patrol_filter', calcPatrolFilterForRequest({ format: 'object' }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, patrolFilter]);

  useEffect(() => {
    if (!!map && trackLengthOrigin === TRACK_LENGTH_ORIGINS.eventFilter) {
      setTrackLengthToEventFilterLowerValue();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, trackLengthOrigin]);

  useEffect(() => {
    if (!!map) {
      onTrackLengthChange();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, trackLength]);

  useEffect(() => {
    if (!!map) {
      fetchMapData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, timeSliderState.active]);

  useEffect(() => {
    if (!!map && userIsGeoPermissionRestricted(user)) {
      debouncedFetchMapEvents();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, userLocation]);

  useEffect(() => {
    if (!!map && showReportHeatmap) {
      onSubjectHeatmapClose();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, showReportHeatmap]);

  useEffect(() => {
    if (!!map && heatmapSubjectIDs.length && showReportHeatmap) {
      onCloseReportHeatmap();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, heatmapSubjectIDs]);

  useEffect(() => {
    if (!!map && !!timeSliderState.active && !!popup) {
      if (popup.type === 'subject') {
        const subjectMatch = mapSubjectFeatureCollection.features
          .find(item => item.properties.id === popup.data.properties.id);

        if (subjectMatch) {
          showPopup('subject', {
            geometry: subjectMatch.geometry,
            properties: subjectMatch.properties,
            coordinates: subjectMatch.geometry.coordinates,
          });
        }
      }
      if (popup.type === 'multi-layer-select') {
        hidePopup(popup.id);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, timeSliderState.virtualDate]);

  useEffect(() => {
    if (!!map) {
      if (!!popup) {
        const { type } = popup;

        if (type === 'feature-symbol' && hiddenFeatureIDs.includes(popup.data.properties.id)) {
          hidePopup(popup.id);
        }
        if (type === 'analyzer-config' && hiddenAnalyzerIDs.includes(popup.data.analyzerId)) {
          hidePopup(popup.id);
        }
      }
    }
  });

  if (!maps.length) return null;

  const timeSliderActive = timeSliderState.active;
  const enableEventClustering = timeSliderActive ? false : true;

  const staticFeatures = (mapSubjectFeatureCollection?.features ?? [])
    .filter(subjectFeature => subjectIsStatic(subjectFeature));
  const staticSubjects = { ...mapSubjectFeatureCollection, ...{ features: staticFeatures } };

  return <EarthRangerMap
    center={lngLatFromParams.current || homeMap.center}
    className={`main-map mapboxgl-map ${mapIsLocked ? 'locked' : ''} ${timeSliderActive ? 'timeslider-active' : ''}`}
    controls={<>
      <AddReport
        className="general-add-button"
        variant="secondary"
        popoverPlacement="left"
        showLabel={false}
      />
      <MapBaseLayerControl />
      <MapMarkerDropper onMarkerDropped={onReportMarkerDrop} />
      <MapRulerControl />
      <MapPrintControl />
      <MapSettingsControl />
      <TimeSliderMapControl />
    </>}
    onMoveStart={(...args) => onMoveStartRef.current(...args)}
    onMoveEnd={(...args) => onMoveEndRef.current(...args)}
    onZoom={(...args) => onZoomRef.current(...args)}
    onClick={(...args) => onMapClickRef.current(...args)}
    onMapLoaded={(...args) => onMapLoadedRef.current(...args)}
    >
    {map && <>
      {children}

      <ClustersLayer onShowClusterSelectPopup={onShowClusterSelectPopup} />

      <DelayedUnmount delay={100} isMounted={showReportsOnMap}>
        <EventsLayer
          enableClustering={enableEventClustering}
          mapImages={mapImages}
          onEventClick={onEventSymbolClick}
          onClusterClick={onClusterClick}
          bounceEventIDs={bounceEventIDs}
        />
      </DelayedUnmount>

      <SubjectsLayer mapImages={mapImages} onSubjectClick={onMapSubjectClick} />

      <MapImagesLayer map={map} />

      <UserCurrentLocationLayer onIconClick={onCurrentUserLocationClick} />

      <StaticSensorsLayer staticSensors={staticSubjects} isTimeSliderActive={timeSliderActive}/>

      <MessageBadgeLayer onBadgeClick={onMessageBadgeClick} />

      <DelayedUnmount isMounted={!currentTab}>
        <div className='floating-report-filter'>
          <EventFilter className='report-filter'/>
        </div>
      </DelayedUnmount>

      <div className='map-legends'>
        <span className='compass-wrapper' onClick={onRotationControlClick} >
          <CursorGpsDisplay />
          <RotationControl
            className='rotation-control'
            style={{
              position: 'relative',
              top: 'auto',
              margin: '0.5rem 0 0 0.5rem',
              borderStyle: 'none',
              borderRadius: '0.25rem',
            }}
          />
        </span>
        <>
          {subjectTracksVisible && <SubjectTrackLegend onClose={onTrackLegendClose} />}
          {subjectHeatmapAvailable && <SubjectHeatmapLegend onClose={onSubjectHeatmapClose} />}
          {showReportHeatmap && <ReportsHeatmapLegend onClose={onCloseReportHeatmap} />}
          {patrolTracksVisible && <PatrolTrackLegend onClose={onPatrolTrackLegendClose} />}
        </>
      </div>

      <RightClickMarkerDropper />

      {subjectHeatmapAvailable && <SubjectHeatLayer />}
      {showReportHeatmap && <ReportsHeatLayer />}

      {subjectTracksVisible && <TrackLayers showTimepoints={showTrackTimepoints} onPointClick={onTimepointClick} />}
      {patrolTracksVisible && <PatrolStartStopLayer />}

      {patrolTracksVisible && <PatrolTracks onPointClick={onTimepointClick} />}

      <FeatureLayer
        symbols={symbolFeatures}
        lines={lineFeatures}
        polygons={fillFeatures}
        onFeatureSymbolClick={onFeatureSymbolClick}
      />

      <AnalyzerLayer
        warningLines={analyzerWarningLines}
        criticalLines={analyzerCriticalLines}
        warningPolys={analyzerWarningPolys}
        criticalPolys={analyzerCriticalPolys}
        layerGroups={layerGroups}
        onAnalyzerGroupEnter={onAnalyzerGroupEnter}
        onAnalyzerGroupExit={onAnalyzerGroupExit}
        onAnalyzerFeatureClick={onAnalyzerFeatureClick}
        map={map}
        isSubjectSymbolsLayerReady={!!map.getLayer(SUBJECT_SYMBOLS)}
      />

      {!!popup && <PopupLayer popup={popup} />}

    </>}

    {timeSliderActive && <TimeSlider />}

    <ReloadOnProfileChange />

    <SleepDetector onSleepDetected={onSleepDetected} />
  </EarthRangerMap>;
};

const mapStatetoProps = (state) => {
  const { data, view } = state;
  const { maps, tracks, eventFilter, user, eventTypes, patrolFilter } = data;
  const {
    hiddenAnalyzerIDs,
    hiddenFeatureIDs,
    homeMap,
    mapIsLocked,
    patrolTrackState,
    popup,
    subjectTrackState,
    heatmapSubjectIDs,
    timeSliderState,
    bounceEventIDs,
    showTrackTimepoints,
    trackLength: { length: trackLength, origin: trackLengthOrigin },
    userLocation,
    showReportsOnMap,
  } = view;

  return ({
    analyzerFeatures: analyzerFeatures(state),
    maps,
    userLocation,
    eventTypes,
    heatmapSubjectIDs,
    tracks,
    hiddenAnalyzerIDs,
    hiddenFeatureIDs,
    homeMap,
    mapIsLocked,
    patrolTrackState,
    popup,
    user,
    eventFilter,
    patrolFilter,
    subjectTrackState,
    showTrackTimepoints,
    showReportsOnMap,
    timeSliderState,
    bounceEventIDs,
    trackLength,
    trackLengthOrigin,
    mapImages: state.view.mapImages,
    mapFeaturesFeatureCollection: getFeatureSetFeatureCollectionsByType(state),
    mapSubjectFeatureCollection: getMapSubjectFeatureCollectionWithVirtualPositioning(state),
    analyzersFeatureCollection: getAnalyzerFeatureCollectionsByType(state),
    showReportHeatmap: state.view.showReportHeatmap,
  });
};

export default connect(mapStatetoProps, {
  addUserNotification,
  clearEventData,
  clearSubjectData,
  fetchBaseLayers,
  fetchMapSubjects,
  fetchMapEvents,
  hidePopup,
  addModal,
  setReportHeatmapVisibility,
  setTrackLength,
  showPopup,
  updateTrackState,
  updatePatrolTrackState,
  updateHeatmapSubjects,
}
)(withMap(Map));

// secret code burial ground
// for future reference and potential experiments
//  {/* <Source
//           id='terrain_source'
//           tileJsonSource={{
//             type: 'vector',
//             url: 'mapbox://mapbox.mapbox-terrain-v2'
//           }}
//         /> */}
// {/* <Layer
//           type='fill-extrusion'
//           sourceLayer='contour'
//           id='terrain_layer'
//           sourceId='terrain_source'
//           paint={{
//             'fill-extrusion-color': [
//               'interpolate',
//               ['linear'],
//               ['get', 'ele'],
//               1000,
//               '#FFF',
//               1500,
//               '#CCC',
//               2000,
//               '#AAA',
//             ],
//             'fill-extrusion-opacity': 1,
//             'fill-extrusion-height': ["/", ['get', 'ele'], 1],
//           }}
//         /> */}
