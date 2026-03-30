import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router';
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
import { MapContext } from '../App';
import { updatePatrolTrackState } from '../ducks/patrols';
import useCrsBoundingBoxLayer from './layers/useCrsBoundingBoxLayer';
import { useMapEventBinding } from '../hooks';
import useNavigate from '../hooks/useNavigate';

import { LAYER_IDS, SYSTEM_CONFIG_FLAGS, TAB_KEYS } from '../constants';

import DelayedUnmount from '../DelayedUnmount';
import EarthRangerMap from '../EarthRangerMap';
import EventsLayer from '../EventsLayer';
import SubjectsLayer from '../SubjectsLayer';
import StaticSensorsLayer from '../StaticSensorsLayer';
import PatrolStartStopLayer from '../PatrolStartStopLayer';
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
import SubjectTileLayer from '../SubjectTileLayer';
import TrackSegmentsLayer from '../TrackSegmentsLayer';
import RealtimeOverlayLayer from '../RealtimeOverlayLayer';
import { fetchRealtimeOverlay } from '../ducks/realtime-overlay';
import SpatialFeaturesLayer, {
  SYMBOLS_LAYER_ID,
  LINES_LAYER_ID,
  POLYGONS_LAYER_ID,
  POLYGONS_OUTLINE_LAYER_ID,
} from '../SpatialFeaturesLayer';


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
import { addMapImage } from '../utils/map';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const CLUSTER_APPROX_WIDTH = 40;
const CLUSTER_APPROX_HEIGHT = 25;

const { SUBJECT_SYMBOLS } = LAYER_IDS;

const MAP_SUPPORTED_TEXT_FIELD_LANGUAGES = ['ar', 'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ha', 'ko', 'vi'];

const replaceLayoutTextFieldLanguage = (textField, language) => {
  if (!Array.isArray(textField) || textField.length === 0) {
    return textField;
  }

  if (textField[0] === 'get' && textField[1].startsWith('name_')) {
    return ['get', `name_${language}`];
  }

  return textField.map((textField) => replaceLayoutTextFieldLanguage(textField, language));
};

const Map = ({ children, onMapLoad, socket }) => {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  useCrsBoundingBoxLayer();

  const map = useContext(MapContext);

  const analyzerFeatures = useSelector(analyzerFeaturesSelector);
  const analyzersEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.ANALYZERS]);
  const analyzersFeatureCollection = useSelector(getAnalyzerFeatureCollectionsByType);
  const bounceEventIDs = useSelector(state => state.view.bounceEventIDs);
  const heatmapSubjectIDs = useSelector(state => state.view.heatmapSubjectIDs);
  const hiddenAnalyzerIDs = useSelector(state => state.data.mapLayerFilter.hiddenAnalyzerIDs);
  const hiddenFeatureIDs = useSelector(state => state.data.mapLayerFilter.hiddenFeatureIDs);
  const eventFilter = useSelector(state => state.data.eventFilter);
  const eventsEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.EVENTS]);
  const mapImages = useSelector(state => state.view.mapImages);
  const mapIsLocked = useSelector(state => state.view.mapIsLocked);
  const mapLocationSelection = useSelector(state => state.view.mapLocationSelection);
  const maps = useSelector(state => state.data.maps);
  const mapSubjectFeatureCollection = useSelector(getMapSubjectFeatureCollectionWithVirtualPositioning);
  const patrolFilter = useSelector(state => state.data.patrolFilter);
  const patrolTrackState = useSelector(state => state.view.patrolTrackState);
  const popup = useSelector(state => state.view.popup);
  const showReportHeatmap = useSelector(state => state.view.showReportHeatmap);
  const spatialFeaturesEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.SPATIAL_FEATURES]);
  const subjectTrackState = useSelector(state => state.view.subjectTrackState);
  const subjectsEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.SUBJECTS]);
  const timeSliderState = useSelector(state => state.view.timeSliderState);
  const trackLength = useSelector(state => state.view.trackSettings.length);
  const trackLengthOrigin = useSelector(state => state.view.trackSettings.origin);

  const messageableMapSubjects = mapSubjectFeatureCollection.features.filter(({ properties }) => !!properties?.messaging?.length);

  const currentTab = getCurrentTabFromURL(location.pathname);

  const showPopup = useCallback((...args) => dispatch(
    showPopupActionCreator(...args)
  ), [dispatch]);

  const hidePopup = useCallback((popupId) => dispatch(
    hidePopupActionCreator(popupId)
  ), [dispatch]);

  const trackRequestCancelToken = useRef(CancelToken.source());
  const overlayCancelToken = useRef(CancelToken.source());

  const timeSliderActive = timeSliderState.active;

  const isDrawingEventGeometry = mapLocationSelection.isPickingLocation
    && mapLocationSelection.mode === MAP_LOCATION_SELECTION_MODES.EVENT_GEOMETRY;

  const isSelectingEventLocation = mapLocationSelection.isPickingLocation
    && mapLocationSelection.event
    && !isDrawingEventGeometry;

  const [currentAnalyzerIds, setCurrentAnalyzerIds] = useState([]);

  const {
    analyzerWarningLines,
    analyzerCriticalLines,
    analyzerWarningPolys,
    analyzerCriticalPolys,
    layerGroups,
  } = analyzersFeatureCollection;

  const subjectHeatmapAvailable = !!heatmapSubjectIDs.length;
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
      .then((latestMapSubjects) => (timeSliderActive
        ? fetchMapSubjectTracksForTimeslider(latestMapSubjects)
        : Promise.resolve(latestMapSubjects)))
      .catch(() => { });
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

        navigate(`/${TAB_KEYS.EVENTS}/${event.id}`);
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

  const onSubjectHeatmapClose = useCallback(() => {
    dispatch(
      updateHeatmapSubjects([])
    );
  }, [dispatch]);

  const onCloseReportHeatmap = useCallback(() => {
    dispatch(
      setReportHeatmapVisibility(false)
    );
  }, [dispatch]);

  const onRotationControlClick = useCallback(() => {
    map.easeTo({ bearing: 0, pitch: 0 });
  }, [map]);

  const onTimepointClick = withLocationPickerState((layer) => {
    const { geometry, properties } = layer;
    showPopup('timepoint', { geometry, properties, coordinates: geometry.coordinates });
  });

  const onFeatureSymbolClick = useCallback((feature) => {
    const { geometry, properties } = feature;

    if (geometry.type === 'Point') {
      showPopup('feature-symbol', { geometry, properties, coordinates: geometry.coordinates });
      mapInteractionTracker.track('Click Map Feature Symbol Icon', `Feature ID :${properties.id}`);
    }
  }, [showPopup]);

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

  // Helper function to check if a feature should keep the popup open
  const doesFeatureOpenPopup = useCallback(
    (feature) => feature.layer.id.includes(LAYER_IDS.TRACK_TIMEPOINTS)
       || [SYMBOLS_LAYER_ID, LINES_LAYER_ID, POLYGONS_LAYER_ID, POLYGONS_OUTLINE_LAYER_ID].includes(feature.layer.id),
    []
  );

  const onMapClick = useMemo(() => withLocationPickerState((event) => {
    event.preventDefault();
    event.originalEvent.stopPropagation();

    // Query features once for performance
    const featuresAtPoint = map.queryRenderedFeatures(event.point);
    const clickedLayersOfInterest = queryMultiLayerClickFeatures(map, event);

    // Check for clusters
    const clusterApproxGeometry = [
      [event.point.x - CLUSTER_APPROX_WIDTH, event.point.y + CLUSTER_APPROX_HEIGHT],
      [event.point.x + CLUSTER_APPROX_WIDTH, event.point.y - CLUSTER_APPROX_HEIGHT]
    ];
    const hasClusters = map.queryRenderedFeatures(clusterApproxGeometry, {
      layers: [LAYER_IDS.CLUSTERS_LAYER_ID]
    }).length > 0;

    // Handle multiple features at the same location
    if (clickedLayersOfInterest.length > 1) {
      handleMultiFeaturesAtSameLocationClick(event, clickedLayersOfInterest);
      hideUnpinnedTrackLayers(map, event);
      return;
    }

    // Determine if we should hide the existing popup
    const shouldHidePopup = !hasClusters && !featuresAtPoint.some(doesFeatureOpenPopup);

    // Handle popup visibility
    if (popup) {
      // Deactivate analyzer features when dismissing an analyzer popup
      if (popup.type === 'analyzer-config') {
        setAnalyzerFeatureActiveStateForIDs(map, currentAnalyzerIds, false);
      }

      if (shouldHidePopup) {
        hidePopup(popup.id);
      }
    }

    hideUnpinnedTrackLayers(map, event);
  }), [
    currentAnalyzerIds,
    handleMultiFeaturesAtSameLocationClick,
    hidePopup,
    hideUnpinnedTrackLayers,
    doesFeatureOpenPopup,
    map,
    popup,
    withLocationPickerState,
  ]);

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
    if (trackLengthOrigin === TRACK_LENGTH_ORIGINS.EVENT_FILTER) {
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

  // Cancel previous overlay request when map/subjectsEnabled changes; cleanup aborts on unmount.
  useEffect(() => {
    if (!map || !subjectsEnabled) return;
    overlayCancelToken.current.cancel();
    overlayCancelToken.current = CancelToken.source();
    dispatch(fetchRealtimeOverlay(map, overlayCancelToken.current));
    return () => {
      overlayCancelToken.current.cancel();
    };
  }, [dispatch, map, subjectsEnabled]);

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
      // If i18n language change, here we update the map layer layouts to set the translated text fields recursively
      let newLanguage = i18n.language.split('-')[0];
      if (!MAP_SUPPORTED_TEXT_FIELD_LANGUAGES.includes(newLanguage)) {
        newLanguage = 'en';
      }

      map.getStyle().layers
        .filter((layer) => layer.type === 'symbol'
          && Array.isArray(layer.layout?.['text-field'])
          && layer.layout?.['text-field'].length)
        .forEach((layer) => map.setLayoutProperty(
          layer.id,
          'text-field',
          replaceLayoutTextFieldLanguage(layer.layout['text-field'], newLanguage)));
    }
  }, [i18n.language, map]);

  useEffect(() => {
    const handleMapStyleImageMissing = async (event) => {
      const { id } = event;
      // querying from the root /static/ dir of the host means this is one of our static assets, let's get it
      // if the map says it's missing.
      // Parse filepath to extract path and dimensions
      const dimensions = {};
      const match = id.match(/^(.*?)(?:-([^-.]+)-([^-.]+))?$/);

      let src = id;
      if (match) {
        const [, path, width, height] = match;
        src = path;

        if (width && width !== 'x') {
          dimensions.width = Number(width);
        }
        if (height && height !== 'x') {
          dimensions.height = Number(height);
        }
      }

      // Remove any remaining trailing dimension strings after the extension
      src = src.replace(/(\.svg|\.png|\.jpg).*$/, '$1');

      try {
        await addMapImage({ src, id, ...dimensions });
      } catch (error) {
        console.warn('Error adding map image:', { event, error });
      }


    };

    if (map) {
      map.on('styleimagemissing', handleMapStyleImageMissing);

      return () => {
        map.off('styleimagemissing', handleMapStyleImageMissing);
      };
    }
  }, [map]);

  useMapEventBinding('movestart', cancelMapDataRequests);
  useMapEventBinding('moveend', fetchMapData);
  useMapEventBinding('moveend', debounce(saveMapPosition));
  useMapEventBinding('zoom', onMapZoom);
  useMapEventBinding('click', onMapClick);

  if (!maps.length) return null;

  return <EarthRangerMap
    className={`main-map mapboxgl-map ${mapIsLocked ? 'locked' : ''} ${timeSliderActive ? 'timeslider-active' : ''}`}
    controls={<>
      <AddItemButton
        analyticsMetadata={{ category: MAP_INTERACTION_CATEGORY, location: 'map controls' }}
        className="general-add-button"
        showLabel={false} variant="secondary"
      />
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
      <MapImagesLayer />

      {eventsEnabled && <EventsLayer
        mapImages={mapImages}
        onEventClick={onSelectEvent}
        bounceEventIDs={bounceEventIDs}
      />}

      {/* Stale subjects: vector tiles. Fresh subjects: GeoJSON. Both are intentional (see SubjectTileLayer). */}
      {subjectsEnabled && <>
        {!timeSliderActive && <SubjectTileLayer onSubjectClick={onSelectSubject} />}

        <SubjectsLayer
        mapImages={mapImages}
        onSubjectClick={onSelectSubject}
        subjectFeatureCollectionOverride={timeSliderActive ? mapSubjectFeatureCollection : undefined}
        />

        <StaticSensorsLayer />

        {!!messageableMapSubjects.length && <MessageBadgeLayer onBadgeClick={onMessageBadgeClick} />}
      </>}


      <UserCurrentLocationLayer onIconClick={onCurrentUserLocationClick} />

      {eventsEnabled && <DelayedUnmount isMounted={!currentTab && !mapLocationSelection.isPickingLocation}>
        <div className='floating-report-filter'>
          <EventFilter className='report-filter' />
        </div>
      </DelayedUnmount>}

      {isDrawingEventGeometry && <ReportGeometryDrawer />}

      {isSelectingEventLocation && <MapLocationSelectionOverview />}

      <div className='map-legends'>
        <span className='compass-wrapper' onClick={onRotationControlClick} >
          <CursorGpsDisplay />
        </span>

        <>
          <SubjectTrackLegend />
          {subjectHeatmapAvailable && <SubjectHeatmapLegend onClose={onSubjectHeatmapClose} />}
          {showReportHeatmap && <ReportsHeatmapLegend onClose={onCloseReportHeatmap} />}
          <PatrolTrackLegend />
        </>
      </div>

      <RightClickMarkerDropper />

      {subjectHeatmapAvailable && <SubjectHeatLayer />}
      {showReportHeatmap && <ReportsHeatLayer />}

      <TrackSegmentsLayer onPointClick={onTimepointClick} />

      {subjectsEnabled && <RealtimeOverlayLayer onSubjectClick={onSelectSubject} />}

      {patrolTracksVisible && <PatrolStartStopLayer />}

      {patrolTracksVisible && <PatrolTracks onPointClick={onTimepointClick} />}

      {spatialFeaturesEnabled && <SpatialFeaturesLayer
        onFeatureClick={onFeatureSymbolClick}
      />}

      {analyzersEnabled && <AnalyzerLayer
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
      />}

      {!!popup && <PopupLayer popup={popup} />}
    </>}

    {timeSliderActive && <TimeSlider />}

    <SleepDetector onSleepDetected={onSleepDetected} />
  </EarthRangerMap>;
};

export default Map;
