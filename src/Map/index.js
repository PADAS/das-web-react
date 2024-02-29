import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import uniq from 'lodash/uniq';
import xor from 'lodash/xor';
import debounce from 'lodash/debounce';
import { CancelToken } from 'axios';
import { differenceInCalendarDays } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { clearSubjectData, fetchMapSubjects, mapSubjectsFetchCancelToken } from '../ducks/subjects';
import { clearEventData, fetchMapEvents, cancelMapEventsFetch } from '../ducks/events';
import { fetchBaseLayers } from '../ducks/layers';
import { setMapPosition } from '../ducks/map-position';
import { TRACK_LENGTH_ORIGINS, setTrackLength } from '../ducks/tracks';
import { showPopup as showPopupActionCreator, hidePopup as hidePopupActionCreator } from '../ducks/popup';
import { setAnalyzerFeatureActiveStateForIDs } from '../utils/analyzers';
import { getPatrolsForLeaderId } from '../utils/patrols';
import { calcEventFilterForRequest } from '../utils/event-filter';
import { calcPatrolFilterForRequest } from '../utils/patrol-filter';
import { fetchTracksIfNecessary } from '../utils/tracks';
import { subjectIsStatic } from '../utils/subjects';
import { withMultiLayerHandlerAwareness, queryMultiLayerClickFeatures } from '../utils/map-handlers';
import { getFeatureSetFeatureCollectionsByType } from '../selectors';
import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../selectors/subjects';
import { trackEventFactory, MAP_INTERACTION_CATEGORY } from '../utils/analytics';
import { findAnalyzerIdByChildFeatureId, getAnalyzerFeaturesAtPoint } from '../utils/analyzers';
import { getCurrentTabFromURL } from '../utils/navigation';
import { analyzerFeatures as analyzerFeaturesSelector, getAnalyzerFeatureCollectionsByType } from '../selectors';
import {
  MAP_LOCATION_SELECTION_MODES,
  setReportHeatmapVisibility,
  updateHeatmapSubjects,
  updateTrackState
} from '../ducks/map-ui';
import { updatePatrolTrackState } from '../ducks/patrols';
import useNavigate from '../hooks/useNavigate';

import {
  LAYER_IDS,
  TAB_KEYS,
} from '../constants';

import DelayedUnmount from '../DelayedUnmount';
import EarthRangerMap, { withMap } from '../EarthRangerMap';
import EventsLayer from '../EventsLayer';
import SubjectsLayer from '../SubjectsLayer';
import StaticSensorsLayer from '../StaticSensorsLayer';
import TracksLayer from '../TracksLayer';
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
import SleepDetector from '../SleepDetector';
import ClustersLayer from '../ClustersLayer';

import AddItemButton from '../AddItemButton';
import MapRulerControl from '../MapRulerControl';
import MapPrintControl from '../MapPrintControl';
import MapMarkerDropper from '../MapMarkerDropper';
import MapBaseLayerControl from '../MapBaseLayerControl';
import PatrolTracks from '../PatrolTracks';
import CursorGpsDisplay from '../CursorGpsDisplay';
import RightClickMarkerDropper from '../RightClickMarkerDropper';
import ReportGeometryDrawer from '../ReportGeometryDrawer';
import MapLocationSelectionOverview from '../MapLocationSelectionOverview';

import './Map.scss';
import { useMapEventBinding } from '../hooks';


const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const CLUSTER_APPROX_WIDTH = 40;
const CLUSTER_APPROX_HEIGHT = 25;

const { SUBJECT_SYMBOLS } = LAYER_IDS;

const Map = ({
  children,
  map,
  onMapLoad,
  socket,
}) => {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const analyzerFeatures = useSelector(analyzerFeaturesSelector);
  const maps = useSelector(state => state.data.maps);
  const heatmapSubjectIDs = useSelector(state => state.view.heatmapSubjectIDs);
  const hiddenAnalyzerIDs = useSelector(state => state.data.mapLayerFilter.hiddenAnalyzerIDs);
  const hiddenFeatureIDs = useSelector(state => state.data.mapLayerFilter.hiddenFeatureIDs);
  const mapIsLocked = useSelector(state => state.view.mapIsLocked);
  const patrolTrackState = useSelector(state => state.view.patrolTrackState);
  const popup = useSelector(state => state.view.popup);
  const eventFilter = useSelector(state => state.data.eventFilter);
  const patrolFilter = useSelector(state => state.data.patrolFilter);
  const subjectTrackState = useSelector(state => state.view.subjectTrackState);
  const showTrackTimepoints = useSelector(state => state.view.showTrackTimepoints);
  const timeSliderState = useSelector(state => state.view.timeSliderState);
  const bounceEventIDs = useSelector(state => state.view.bounceEventIDs);
  const trackLength = useSelector(state => state.view.trackLength.length);
  const trackLengthOrigin = useSelector(state => state.view.trackLength.origin);
  const mapImages = useSelector(state => state.view.mapImages);
  const mapFeaturesFeatureCollection = useSelector(getFeatureSetFeatureCollectionsByType);
  const mapSubjectFeatureCollection = useSelector(getMapSubjectFeatureCollectionWithVirtualPositioning);
  const analyzersFeatureCollection = useSelector(getAnalyzerFeatureCollectionsByType);
  const showReportHeatmap = useSelector(state => state.view.showReportHeatmap);
  const mapLocationSelection = useSelector(state => state.view.mapLocationSelection);

  const currentTab = getCurrentTabFromURL(location.pathname);

  const showPopup = useCallback((...args) => dispatch(
    showPopupActionCreator(...args)
  ), [dispatch]);

  const hidePopup = useCallback((popupId) => dispatch(
    hidePopupActionCreator(popupId)
  ), [dispatch]);

  const trackRequestCancelToken = useRef(CancelToken.source());

  const timeSliderActive = timeSliderState.active;

  const isDrawingEventGeometry = mapLocationSelection.isPickingLocation
    && mapLocationSelection.mode  === MAP_LOCATION_SELECTION_MODES.EVENT_GEOMETRY;

  const isSelectingEventLocation = mapLocationSelection.isPickingLocation
    && !isDrawingEventGeometry;

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

  const cancelMapDataRequests = useCallback(() => {
    mapSubjectsFetchCancelToken.cancel();
    cancelMapEventsFetch();
  }, []);

  const mapEventsFetch = useCallback(() => {
    return dispatch(fetchMapEvents(map))
      .catch((e) => console.warn('error fetching map events', e));
  }
  , [dispatch, map]);

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

    if (timeSliderActive) {
      const { lower: updated_since, upper: updated_until } = eventFilter.filter.date_range;

      args.push({ updated_since, updated_until });
    }

    return dispatch(fetchMapSubjects(...args))
      .then((latestMapSubjects) => timeSliderActive
        ? fetchMapSubjectTracksForTimeslider(latestMapSubjects)
        : Promise.resolve(latestMapSubjects))
      .catch(() => {});
  },
  [
    dispatch,
    eventFilter.filter.date_range,
    fetchMapSubjectTracksForTimeslider,
    map,
    timeSliderActive,
  ]);

  const debouncedFetchEventsAndSubjects = useMemo(() =>
    debounce(() =>
      Promise.all(
        [mapEventsFetch(), fetchMapSubjectsFromTimeslider()]
      )
        .catch((e) =>
          console.warn('error loading map data', e)
        ), 100)
  , [mapEventsFetch, fetchMapSubjectsFromTimeslider]);

  const fetchMapData = useCallback(() => {
    cancelMapDataRequests();

    return debouncedFetchEventsAndSubjects();
  }, [debouncedFetchEventsAndSubjects, cancelMapDataRequests]);


  const saveMapPosition = useCallback(() => {
    if (map) {
      const bearing = map.getBearing();
      const center = map.getCenter();
      const pitch = map.getPitch();

      const zoom = parseFloat(map.getZoom().toFixed(2));
      dispatch(
        setMapPosition({ bearing, center, pitch, zoom })
      );
    }
  }, [dispatch, map]);

  const onMapZoom = debounce(() => {
    if (popup?.type === 'multi-layer-select') {
      hidePopup(popup.id);
    }
  }, 100);

  const withLocationPickerState = useCallback((func) => (...args) => {
    if (!mapLocationSelection.isPickingLocation) {
      return func(...args);
    }
  }, [mapLocationSelection.isPickingLocation]);

  const onSelectSubject = withLocationPickerState(
    async ({ layer }) => {
      const { geometry, properties } = layer;
      const { id, tracks_available } = properties;

      window.setTimeout(() => showPopup('subject', { geometry, properties, coordinates: geometry.coordinates }));

      await tracks_available ? fetchTracksIfNecessary([id]) : new Promise(resolve => resolve());

      if (tracks_available) {
        dispatch(
          updateTrackState({ visible: [...subjectTrackState.visible, id] })
        );
      }

      mapInteractionTracker.track('Click Map Subject Icon', `Subject Type:${properties.subject_type}`);
    }
  );


  const onSelectEvent = withLocationPickerState(
    ({ layer: { properties: event } }) => {
      setTimeout(() => {
        mapInteractionTracker.track('Click Map Event', `Event Type:${event.event_type}`);

        navigate(`/${TAB_KEYS.REPORTS}/${event.id}`);
      }, 50);
    }
  );

  const handleMultiFeaturesAtSameLocationClick = useCallback((event, layers) => {
    showPopup('multi-layer-select', {
      layers,
      coordinates: [event.lngLat.lng, event.lngLat.lat],
      onSelectSubject: onSelectSubject,
      onSelectEvent: onSelectEvent,
    });
  }, [onSelectEvent, onSelectSubject, showPopup]);

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
    dispatch(
      updateTrackState({ visible: visible.filter(id => clickedLayerIDs.includes(id)) })
    );
    dispatch(
      updatePatrolTrackState({ visible: visiblePatrolIds.filter(id => matchingPatrolIds.includes(id)) })
    );
  }, [patrolTrackState, subjectTrackState, dispatch]);

  const setMap = useCallback((map) => {
    window.map = map;

    onMapLoad(map);
  }, [onMapLoad]);

  const onShowClusterSelectPopup = useCallback((layers, coordinates) => {
    showPopup('cluster-select', {
      layers,
      coordinates,
      onSelectEvent: onSelectEvent,
      onSelectSubject: onSelectSubject,
    });
  }, [onSelectEvent, onSelectSubject, showPopup]);

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
    dispatch(
      updateTrackState({ visible: [], pinned: [] })
    );
  }, [dispatch]);

  const onSubjectHeatmapClose = useCallback(() => {
    dispatch(
      updateHeatmapSubjects([])
    );
  }, [dispatch]);

  const onCloseReportHeatmap = useCallback(()  => {
    dispatch (
      setReportHeatmapVisibility(false)
    );
  }, [dispatch]);

  const onPatrolTrackLegendClose = useCallback(() => {
    dispatch(
      updatePatrolTrackState({ visible: [], pinned: [] })
    );
  }, [dispatch]);

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

  const onAnalyzerFeatureClick = withLocationPickerState(
    withMultiLayerHandlerAwareness(
      map,
      (e) => {
        const features = getAnalyzerFeaturesAtPoint(map, e.point);
        setAnalyzerFeatureActiveStateForIDs(map, currentAnalyzerIds, true);
        const properties = features[0].properties;
        const geometry = e.lngLat;
        const analyzerId = findAnalyzerIdByChildFeatureId(properties.id, analyzerFeatures);

        showPopup('analyzer-config', { geometry, properties, analyzerId, coordinates: geometry });
      })
  );

  const onSleepDetected = useCallback(() => {
    fetchMapData();
  }, [fetchMapData]);

  const onMapClick = useMemo(() => withLocationPickerState((event) => {
    event.preventDefault();
    event.originalEvent.stopPropagation();

    const clickedLayersOfInterest = queryMultiLayerClickFeatures(map, event);

    let shouldHidePopup = true;

    const clusterApproxGeometry = [
      [event.point.x - CLUSTER_APPROX_WIDTH, event.point.y + CLUSTER_APPROX_HEIGHT],
      [event.point.x + CLUSTER_APPROX_WIDTH, event.point.y - CLUSTER_APPROX_HEIGHT]
    ];
    const clustersAtPoint = map.queryRenderedFeatures(
      clusterApproxGeometry,
      { layers: [LAYER_IDS.CLUSTERS_LAYER_ID] }
    );

    shouldHidePopup = !clustersAtPoint.length;

    if (clickedLayersOfInterest.length > 1) {
      handleMultiFeaturesAtSameLocationClick(event, clickedLayersOfInterest);
      shouldHidePopup = false;
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
  }), [currentAnalyzerIds, map, withLocationPickerState, handleMultiFeaturesAtSameLocationClick, hidePopup, hideUnpinnedTrackLayers, popup]);

  useEffect(() => {
    return () => {
      dispatch(
        clearEventData()
      );
      dispatch(
        clearSubjectData()
      );
    };
  }, [dispatch]);

  const setTrackLengthToEventFilterLowerValue = useCallback(() => {
    dispatch(
      setTrackLength(differenceInCalendarDays(new Date(), eventFilter.filter.date_range.lower))
    );
  }, [dispatch, eventFilter.filter.date_range.lower]);

  const onTrackLengthChange = useCallback(() => {
    resetTrackRequestCancelToken();
    fetchTracksIfNecessary(uniq([...subjectTrackState.visible, ...subjectTrackState.pinned, ...heatmapSubjectIDs]));
  }, [heatmapSubjectIDs, resetTrackRequestCancelToken, subjectTrackState.pinned, subjectTrackState.visible]);

  useEffect(() => {
    dispatch(
      fetchBaseLayers()
    );
  }, [dispatch]);

  useEffect(() => {
    if (map) {
      mapEventsFetch();
    }
  }, [eventFilter, mapEventsFetch, map]);

  useEffect(() => {
    if (!!map) {
      socket.emit('event_filter', calcEventFilterForRequest({ format: 'object' }));
    }

  }, [eventFilter, map, socket]);

  useEffect(() => {
    if (trackLengthOrigin === TRACK_LENGTH_ORIGINS.eventFilter) {
      setTrackLengthToEventFilterLowerValue();
    }
  }, [trackLengthOrigin, setTrackLengthToEventFilterLowerValue]);

  useEffect(() => {
    if (map && socket) {
      socket.emit('patrol_filter', calcPatrolFilterForRequest({ format: 'object' }));
    }
  }, [map, patrolFilter, socket]);

  useEffect(() => {
    if (map) {
      onTrackLengthChange();
    }
  }, [map, onTrackLengthChange, trackLength]);

  useEffect(() => {
    if (map) {
      fetchMapData();
    }
  }, [fetchMapData, map, timeSliderState.active]);

  useEffect(() => {
    if (!!map && heatmapSubjectIDs.length && showReportHeatmap) {
      onCloseReportHeatmap();
    }
  }, [map, heatmapSubjectIDs.length, showReportHeatmap, onCloseReportHeatmap]);

  useEffect(() => {
    if (map && !!timeSliderState.active && !!popup) {
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
    if (!!map && !!popup) {
      const { type } = popup;

      if (type === 'feature-symbol' && hiddenFeatureIDs.includes(popup.data.properties.id)) {
        hidePopup(popup.id);
      }
      if (type === 'analyzer-config' && hiddenAnalyzerIDs.includes(popup.data.analyzerId)) {
        hidePopup(popup.id);
      }
    }
  }, [hiddenAnalyzerIDs, hiddenFeatureIDs, hidePopup, map, popup]);

  useEffect(() => {
    if (!!map) {
      const layersToTranslate = [
        'road-label',
        'road-intersection',
        'path-pedestrian-label',
        'golf-hole-label',
        'ferry-aerialway-label',
        'waterway-label',
        'natural-line-label',
        'natural-point-label',
        'water-line-label',
        'water-point-label',
        'poi-label',
        'settlement-subdivision-label',
        'settlement-minor-label',
        'settlement-major-label',
        'state-label',
        'country-label',
        'continent-label',
      ];
      layersToTranslate.forEach((layer) => {
        map.setLayoutProperty(layer, 'text-field', ['get', `name_${i18n.language.split('-')[0]}`]);
      });
    }
  }, [i18n.language, map]);

  useMapEventBinding('movestart', cancelMapDataRequests);
  useMapEventBinding('moveend', fetchMapData);
  useMapEventBinding('moveend', debounce(saveMapPosition));
  useMapEventBinding('zoom', onMapZoom);
  useMapEventBinding('click', onMapClick);

  if (!maps.length) return null;

  return <EarthRangerMap
    className={`main-map mapboxgl-map ${mapIsLocked ? 'locked' : ''} ${timeSliderActive ? 'timeslider-active' : ''}`}
    controls={<>
      <AddItemButton className="general-add-button" showLabel={false} variant="secondary" />
      <MapBaseLayerControl />
      <MapMarkerDropper onMarkerDropped={onReportMarkerDrop} />
      <MapRulerControl />
      <MapPrintControl />
      <TimeSliderMapControl />
    </>}
    onMapLoaded={setMap}
    >
    {map && <>
      {children}

      <ClustersLayer onShowClusterSelectPopup={onShowClusterSelectPopup} />

      <EventsLayer
          mapImages={mapImages}
          onEventClick={onSelectEvent}
          bounceEventIDs={bounceEventIDs}
        />

      <SubjectsLayer mapImages={mapImages} onSubjectClick={onSelectSubject} />

      <MapImagesLayer map={map} />

      <UserCurrentLocationLayer onIconClick={onCurrentUserLocationClick} />

      <StaticSensorsLayer />

      <MessageBadgeLayer onBadgeClick={onMessageBadgeClick} />

      <DelayedUnmount isMounted={!currentTab && !mapLocationSelection.isPickingLocation}>
        <div className='floating-report-filter'>
          <EventFilter className='report-filter'/>
        </div>
      </DelayedUnmount>

      {isDrawingEventGeometry && <ReportGeometryDrawer />}
      {isSelectingEventLocation && <MapLocationSelectionOverview />}

      <div className='map-legends'>
        <span className='compass-wrapper' onClick={onRotationControlClick} >
          <CursorGpsDisplay />
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

      {subjectTracksVisible && <TracksLayer onPointClick={onTimepointClick} showTimepoints={showTrackTimepoints} />}
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

    <SleepDetector onSleepDetected={onSleepDetected} />
  </EarthRangerMap>;
};


export default withMap(Map);
