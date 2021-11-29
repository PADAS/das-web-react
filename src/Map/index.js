import React, { Component, Fragment } from 'react';
import { withRouter } from 'react-router-dom';
import { RotationControl } from 'react-mapbox-gl';
import { connect } from 'react-redux';
import uniq from 'lodash/uniq';
import xor from 'lodash/xor';
import debounce from 'lodash/debounce';
import uniqBy from 'lodash/uniqBy';
import partition from 'lodash/partition';
import isEqual from 'react-fast-compare';
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
import { calcEventFilterForRequest } from '../utils/event-filter';
import { fetchTracksIfNecessary } from '../utils/tracks';
import { getFeatureSetFeatureCollectionsByType } from '../selectors';
import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../selectors/subjects';
import { getMapEventFeatureCollectionWithVirtualDate } from '../selectors/events';
import { trackEventFactory, MAP_INTERACTION_CATEGORY } from '../utils/analytics';
import { findAnalyzerIdByChildFeatureId, getAnalyzerFeaturesAtPoint } from '../utils/analyzers';
import { analyzerFeatures, getAnalyzerFeatureCollectionsByType } from '../selectors';
import { updateTrackState, updateHeatmapSubjects, toggleMapLockState, setReportHeatmapVisibility } from '../ducks/map-ui';
import { addModal } from '../ducks/modals';
import { updatePatrolTrackState } from '../ducks/patrols';
import { addUserNotification } from '../ducks/user-notifications';
import { updateUserPreferences } from '../ducks/user-preferences';

import { BREAKPOINTS, LAYER_IDS, LAYER_PICKER_IDS, MAX_ZOOM } from '../constants';

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
// import IsochroneLayer from '../IsochroneLayer';
import MapImagesLayer from '../MapImagesLayer';
import ReloadOnProfileChange from '../ReloadOnProfileChange';
import SleepDetector from '../SleepDetector';

import MapRulerControl from '../MapRulerControl';
import MapPrintControl from '../MapPrintControl';
import MapMarkerDropper from '../MapMarkerDropper';
import MapBaseLayerControl from '../MapBaseLayerControl';
import MapSettingsControl from '../MapSettingsControl';
import PatrolTracks from '../PatrolTracks';
import CursorGpsDisplay from '../CursorGpsDisplay';
import RightClickMarkerDropper from '../RightClickMarkerDropper';

import './Map.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

class Map extends Component {

  constructor(props) {
    super(props);
    this.setMap = this.setMap.bind(this);
    this.onMapMoveStart = this.onMapMoveStart.bind(this);
    this.onMapMoveEnd = this.onMapMoveEnd.bind(this);
    this.debouncedFetchMapData = this.debouncedFetchMapData.bind(this);
    this.debouncedFetchMapEvents = this.debouncedFetchMapEvents.bind(this);
    this.withLocationPickerState = this.withLocationPickerState.bind(this);
    this.onClusterClick = this.onClusterClick.bind(this);
    this.onMapClick = this.onMapClick.bind(this);
    this.onMapZoom = this.onMapZoom.bind(this);
    this.onMapSubjectClick = this.onMapSubjectClick.bind(this);
    this.onMessageBadgeClick = this.onMessageBadgeClick.bind(this);
    this.onTimepointClick = this.onTimepointClick.bind(this);
    this.debouncedFetchMapData = this.debouncedFetchMapData.bind(this);
    this.onSubjectHeatmapClose = this.onSubjectHeatmapClose.bind(this);
    this.onTrackLegendClose = this.onTrackLegendClose.bind(this);
    this.onPatrolTrackLegendClose = this.onPatrolTrackLegendClose.bind(this);
    this.onEventSymbolClick = this.onEventSymbolClick.bind(this);
    this.onClusterLeafClick = this.onClusterLeafClick.bind(this);
    this.onFeatureSymbolClick = this.onFeatureSymbolClick.bind(this);
    this.onReportMarkerDrop = this.onReportMarkerDrop.bind(this);
    this.onCurrentUserLocationClick = this.onCurrentUserLocationClick.bind(this);
    this.onTrackLengthChange = this.onTrackLengthChange.bind(this);
    this.onCloseReportHeatmap = this.onCloseReportHeatmap.bind(this);
    this.fetchMapData = this.fetchMapData.bind(this);
    this.onRotationControlClick = this.onRotationControlClick.bind(this);
    this.trackRequestCancelToken = CancelToken.source();
    this.onSleepDetected = this.onSleepDetected.bind(this);
    this.handleMultiFeaturesAtSameLocationClick = this.handleMultiFeaturesAtSameLocationClick.bind(this);
    this.currentAnalyzerIds = [];

    this.fetchingMapData = false;

    const location = new URLSearchParams(this.props.location.search).get('lnglat');

    if (location) {
      this.lngLatFromParams = location.replace(' ', '').split(',').map(n => parseFloat(n));
      const newLocation = { ...this.props.location };

      delete newLocation.search;
      this.props.history.push(newLocation);
    }
  }


  get mapCenter() {
    return this.lngLatFromParams || this.props.homeMap.center;
  }

  onSleepDetected() {
    this.debouncedFetchMapData();
  }

  onMapZoom = debounce((e) => {

    if (!!this.props.popup && this.props.popup.type === 'multi-layer-select') {
      this.props.hidePopup(this.props.popup.id);
    }
  }, 100)

  withLocationPickerState(func) {
    return (...args) => {
      if (!this.props.pickingLocationOnMap) {
        return func(...args);
      }
    };
  }

  componentDidMount() {
    this.props.fetchBaseLayers();
    if (this.props.trackLengthOrigin === TRACK_LENGTH_ORIGINS.eventFilter) {
      this.setTrackLengthToEventFilterLowerValue();
    }
  }

  componentWillUnmount() {
    this.props.clearEventData();
    this.props.clearSubjectData(); // map data cleanup
  }

  componentDidUpdate(prev) {
    if (!this.props.map) return;

    if ((this.props.homeMap !== prev.homeMap)
      && this.props.homeMap.id) {
      const { zoom, center } = this.props.homeMap;
      jumpToLocation(this.props.map, this.lngLatFromParams || center, zoom);
      if (this.lngLatFromParams) {
        delete this.lngLatFromParams;
      }
    }

    if (!isEqual(prev.eventFilter, this.props.eventFilter)) {
      this.props.socket.emit('event_filter', calcEventFilterForRequest({ format: 'object' }));
      if (this.props.trackLengthOrigin === TRACK_LENGTH_ORIGINS.eventFilter
        && !isEqual(prev.eventFilter.filter.date_range.lower, this.props.eventFilter.filter.date_range.lower)) {
        this.setTrackLengthToEventFilterLowerValue();

      }
      this.debouncedFetchMapEvents();
    }
    if (!isEqual(prev.trackLengthOrigin, this.props.trackLengthOrigin) && this.props.trackLengthOrigin === TRACK_LENGTH_ORIGINS.eventFilter) {
      this.setTrackLengthToEventFilterLowerValue();
    }
    if (!isEqual(prev.trackLength, this.props.trackLength)) {
      this.onTrackLengthChange();
    }
    if (!isEqual(prev.timeSliderState.active, this.props.timeSliderState.active)) {
      this.debouncedFetchMapData();
    }
    if (!isEqual(this.props.showReportHeatmap, prev.showReportHeatmap) && this.props.showReportHeatmap) {
      this.onSubjectHeatmapClose();
    }
    if ((this.props.heatmapSubjectIDs !== prev.heatmapSubjectIDs) && !!this.props.heatmapSubjectIDs.length && this.props.showReportHeatmap) {
      this.onCloseReportHeatmap();
    }

    if (!!this.props.timeSliderState.active && !!this.props.popup
      && !isEqual(prev.timeSliderState.virtualDate, this.props.timeSliderState.virtualDate)
    ) {
      if (this.props.popup.type === 'subject') {
        const subjectMatch = this.props.mapSubjectFeatureCollection.features.find(item => item.properties.id === this.props.popup.data.properties.id);

        if (subjectMatch) {
          this.props.showPopup('subject', {
            geometry: subjectMatch.geometry,
            properties: subjectMatch.properties,
            coordinates: subjectMatch.geometry.coordinates,
          });
        }
      }
      if (this.props.popup.type === 'multi-layer-select') {
        this.props.hidePopup(this.props.popup.id);
      }
    }
    if (!!this.props.popup) {
      const { type } = this.props.popup;

      if (type === 'feature-symbol' && this.props.hiddenFeatureIDs.includes(this.props.popup.data.properties.id)) {
        this.props.hidePopup(this.props.popup.id);
      }
      if (type === 'analyzer-config' && this.props.hiddenAnalyzerIDs.includes(this.props.popup.data.analyzerId)) {
        this.props.hidePopup(this.props.popup.id);
      }
    }
  }

  setTrackLengthToEventFilterLowerValue() {
    this.props.setTrackLength(differenceInCalendarDays(
      new Date(),
      this.props.eventFilter.filter.date_range.lower,
    ));
  }
  onTimepointClick = this.withLocationPickerState((layer) => {
    const { geometry, properties } = layer;
    this.props.showPopup('timepoint', { geometry, properties, coordinates: geometry.coordinates });
  })

  onMapMoveStart() {
    mapSubjectsFetchCancelToken.cancel();
    cancelMapEventsFetch();
  }

  onMapMoveEnd() {
    this.debouncedFetchMapData();
  }

  onRotationControlClick = (e) => {
    this.props.map.easeTo({
      bearing: 0,
      pitch: 0,
    });
  }

  toggleMapLockState(e) {
    return toggleMapLockState();
  }

  resetTrackRequestCancelToken() {
    this.trackRequestCancelToken.cancel();
    this.trackRequestCancelToken = CancelToken.source();
  }

  clearSelectedAnalyzerIds() {
    setAnalyzerFeatureActiveStateForIDs(this.props.map, this.currentAnalyzerIds, false);
    this.currentAnalyzerIds = [];
  }

  fetchMapData() {
    if (!this.fetchingMapData) {
      this.fetchingMapData = true;
      return Promise.all([
        this.fetchMapEvents(),
        this.fetchMapSubjects(),
      ])
        .catch((e) => {
          console.warn('error loading map data', e);
        })
        .finally(() => {
          this.fetchingMapData = false;
        });
    }
  }

  debouncedFetchMapData = debounce(this.fetchMapData, 500)
  debouncedFetchMapEvents = debounce(this.fetchMapEvents, 300);

  fetchMapSubjects() {
    const args = [this.props.map];
    const timeSliderActive = this.props.timeSliderState.active;

    if (timeSliderActive) {
      const { lower: updated_since, upper: updated_until } = this.props.eventFilter.filter.date_range;

      args.push({
        updated_since, updated_until,
      });
    }

    return this.props.fetchMapSubjects(...args)
      .then((latestMapSubjects) => timeSliderActive ? this.fetchMapSubjectTracksForTimeslider(latestMapSubjects) : Promise.resolve(latestMapSubjects))
      .catch((e) => {
        // console.log('error fetching map subjects', e.__CANCEL__); handle errors here if not a cancelation
      });
  }
  handleMultiFeaturesAtSameLocationClick(event, layers) {
    this.props.showPopup('multi-layer-select',
      {
        layers,
        coordinates: [event.lngLat.lng, event.lngLat.lat],
        onSelectSubject: this.onMapSubjectClick,
        onSelectEvent: this.onEventSymbolClick,
      },
    );

  }
  fetchMapSubjectTracksForTimeslider(subjects) {
    this.resetTrackRequestCancelToken();
    return fetchTracksIfNecessary(subjects
      .filter(({ last_position_date }) => (new Date(last_position_date) - new Date(this.props.eventFilter.filter.date_range.lower) >= 0))
      .map(({ id }) => id));
  }

  fetchMapEvents() {
    return this.props.fetchMapEvents(this.props.map)
      .catch((e) => {
        console.warn('error fetching map events', e);
      });
  }
  onMapClick = this.withLocationPickerState((map, event) => {
    const clusterFeaturesAtPoint = map.queryRenderedFeatures(event.point, { layers: [LAYER_IDS.EVENT_CLUSTERS_CIRCLES] });
    const clickedLayersOfInterest = uniqBy(
      map.queryRenderedFeatures(event.point, { layers: LAYER_PICKER_IDS.filter(id => !!map.getLayer(id)) })
      , layer => layer.properties.id);

    let showingMultiPopup;

    if (!!clusterFeaturesAtPoint.length || clickedLayersOfInterest.length > 1) { /* only propagate click events when not on clusters or areas which require disambiguation */
      event.originalEvent.cancelBubble = true;
    }

    if (clickedLayersOfInterest.length > 1) {
      if (!clusterFeaturesAtPoint.length) {  /* cluster clicks take precendence over disambiguation popover */
        this.handleMultiFeaturesAtSameLocationClick(event, clickedLayersOfInterest);
        showingMultiPopup = true;
      }
    }

    if (this.props.popup) {
      // be sure to also deactivate the analyzer features
      // when dismissing an analyzer popup
      if (this.props.popup.type === 'analyzer-config') {
        const { map } = this.props;
        setAnalyzerFeatureActiveStateForIDs(map, this.currentAnalyzerIds, false);
      }
      if (!showingMultiPopup) {
        this.props.hidePopup(this.props.popup.id);
      }
    }
    this.hideUnpinnedTrackLayers(map, event);

    if (this.props.userPreferences.sidebarOpen && !BREAKPOINTS.screenIsLargeLayoutOrLarger.matches) {
      this.props.updateUserPreferences({ sidebarOpen: false });
    }
  })

  onEventSymbolClick = this.withLocationPickerState(({ event: clickEvent, layer: { properties } }) => {
    if (clickEvent && clickEvent.originalEvent && clickEvent.originalEvent.cancelBubble) return;

    const { map } = this.props;
    const event = cleanUpBadlyStoredValuesFromMapSymbolLayer(properties);

    mapInteractionTracker.track('Click Map Event Icon', `Event Type:${event.event_type}`);
    openModalForReport(event, map);
  })

  onClusterLeafClick = this.withLocationPickerState((report) => {
    this.onEventSymbolClick({ layer: { properties: report } });
  });

  onFeatureSymbolClick = this.withLocationPickerState(({ geometry, properties }) => {
    const coordinates = Array.isArray(geometry.coordinates[0]) ? geometry.coordinates[0] : geometry.coordinates;

    this.props.showPopup('feature-symbol', { geometry, properties, coordinates });
    mapInteractionTracker.track('Click Map Feature Symbol Icon', `Feature ID :${properties.id}`);
  })

  onAnalyzerGroupEnter = (e, groupIds) => {
    // if an analyzer popup is open, and the user selects a new 
    // analyzer, dismiss the current pop. 
    if (xor(groupIds, this.currentAnalyzerIds).length !== 0) {
      if (this.props.popup && this.props.popup.type === 'analyzer-config') {
        this.props.hidePopup(this.props.popup.id);
      }
    }
    this.clearSelectedAnalyzerIds();
    this.currentAnalyzerIds = groupIds;
    const { map } = this.props;
    setAnalyzerFeatureActiveStateForIDs(map, groupIds, true);
  }

  onAnalyzerGroupExit = (e, groupIds) => {
    // shortcircuit when the analyzer popup is displayed
    if (this.props.popup && this.props.popup.type === 'analyzer-config') return;
    const { map } = this.props;
    setAnalyzerFeatureActiveStateForIDs(map, groupIds, false);
  }

  onAnalyzerFeatureClick = this.withLocationPickerState((e) => {
    const { map } = this.props;
    const features = getAnalyzerFeaturesAtPoint(map, e.point);
    setAnalyzerFeatureActiveStateForIDs(map, this.currentAnalyzerIds, true);
    const properties = features[0].properties;
    const geometry = e.lngLat;
    const analyzerId = findAnalyzerIdByChildFeatureId(properties.id, this.props.analyzerFeatures);
    this.props.showPopup('analyzer-config', { geometry, properties, analyzerId, coordinates: geometry });
  })

  hideUnpinnedTrackLayers(map, event) {
    const { updatePatrolTrackState, updateTrackState, patrolTrackState: { visible: visiblePatrolIds }, subjectTrackState: { visible } } = this.props;
    if (!visible.length) return;

    const clickedLayerIDs = map.queryRenderedFeatures(event.point)
      .filter(({ properties }) => !!properties && properties.id)
      .map(({ properties: { id } }) => id);

    const matchingPatrolIds = clickedLayerIDs.reduce((accumulator, id) => [...accumulator, ...getPatrolsForLeaderId(id)], []).map(({ id }) => id);

    updateTrackState({
      visible: visible.filter(id => clickedLayerIDs.includes(id)),
    });
    updatePatrolTrackState({
      visible: visiblePatrolIds.filter(id => matchingPatrolIds.includes(id)),
    });
  }
  onCloseReportHeatmap() {
    this.props.setReportHeatmapVisibility(false);
  }

  onClusterClick = this.withLocationPickerState(({ point, lngLat }) => {
    const features = this.props.map.queryRenderedFeatures(point, { layers: [LAYER_IDS.EVENT_CLUSTERS_CIRCLES] });
    const clusterId = features[0].properties.cluster_id;
    const clusterSource = this.props.map.getSource('events-data-clustered');

    clusterSource.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;

      const mapZoom = this.props.map.getZoom();
      const newMapZoom = (zoom > MAX_ZOOM) ? MAX_ZOOM : zoom;

      if (mapZoom < MAX_ZOOM
        && mapZoom < zoom) {
        this.props.map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: newMapZoom
        });
      }
    });
  })

  onCurrentUserLocationClick = this.withLocationPickerState((location) => {
    this.props.showPopup('current-user-location', { location, coordinates: [location.coords.longitude, location.coords.latitude] });
    mapInteractionTracker.track('Click Current User Location Icon');
  })

  onMapSubjectClick = this.withLocationPickerState(async ({ event, layer }) => {
    if (event && event.originalEvent && event.originalEvent.cancelBubble) return;

    const { geometry, properties } = layer;
    const { id, tracks_available } = properties;
    const { updateTrackState, subjectTrackState } = this.props;

    this.props.showPopup('subject', { geometry, properties, coordinates: geometry.coordinates });

    await (tracks_available) ? fetchTracksIfNecessary([id]) : new Promise(resolve => resolve());

    if (tracks_available) {
      updateTrackState({
        visible: [...subjectTrackState.visible, id]
      });
    }
    mapInteractionTracker.track('Click Map Subject Icon', `Subject Type:${properties.subject_type}`);
  });

  onMessageBadgeClick = this.withLocationPickerState(({ event, layer }) => {
    const { geometry, properties } = layer;

    this.props.showPopup('subject-messages', { geometry, properties, coordinates: geometry.coordinates });
  })

  setMap(map) {
    // don't set zoom if not hydrated
    if (this.props.homeMap && this.props.homeMap.zoom) {
      if (this.lngLatFromParams) {
        map.setZoom(16);
      } else {
        map.setZoom(this.props.homeMap.zoom);
      }
    };
    window.map = map;

    this.props.onMapLoad(map);
    this.debouncedFetchMapData();
  }

  onSubjectHeatmapClose() {
    this.props.updateHeatmapSubjects([]);
  }
  onTrackLegendClose() {
    const { updateTrackState } = this.props;
    updateTrackState({
      visible: [],
      pinned: [],
    });
  }

  onPatrolTrackLegendClose() {
    const { updatePatrolTrackState } = this.props;
    updatePatrolTrackState({
      visible: [],
      pinned: [],
    });
  }

  onReportMarkerDrop(location) {
    const coordinates = [location.lng, location.lat];

    this.props.showPopup('dropped-marker', { location, coordinates });
  }

  onTrackLengthChange() {
    this.resetTrackRequestCancelToken();
    fetchTracksIfNecessary(uniq([...this.props.subjectTrackState.visible, ...this.props.subjectTrackState.pinned, ...this.props.heatmapSubjectIDs]));
  }

  render() {
    const { children, maps, map, mapImages, popup, mapSubjectFeatureCollection,
      mapEventFeatureCollection, mapFeaturesFeatureCollection, analyzersFeatureCollection,
      heatmapSubjectIDs, mapIsLocked, showTrackTimepoints, subjectTrackState, showReportsOnMap, bounceEventIDs,
      patrolTrackState, subjectsOnActivePatrol, timeSliderState: { active: timeSliderActive } } = this.props;

    const { showReportHeatmap } = this.props;

    const { symbolFeatures, lineFeatures, fillFeatures } = mapFeaturesFeatureCollection;

    const { analyzerWarningLines, analyzerCriticalLines,
      analyzerWarningPolys, analyzerCriticalPolys, layerGroups } = analyzersFeatureCollection;

    const subjectHeatmapAvailable = !!heatmapSubjectIDs.length;
    const subjectTracksVisible = !!subjectTrackState.pinned.length || !!subjectTrackState.visible.length;
    const patrolTracksVisible = !!patrolTrackState.pinned.length || !!patrolTrackState.visible.length;

    if (!maps.length) return null;

    const enableEventClustering = timeSliderActive ? false : true;

    const [staticFeatures, nonStaticFeatures] = partition(mapSubjectFeatureCollection?.features ?? [], subjectFeature => subjectFeature.properties.subject_type === 'static_sensor');
    const staticSubjects = { ...mapSubjectFeatureCollection, ...{ features: staticFeatures } };
    const nonStaticSubjects = { ...mapSubjectFeatureCollection, ...{ features: nonStaticFeatures } };

    return (
      <EarthRangerMap
        center={this.mapCenter}
        className={`main-map mapboxgl-map ${mapIsLocked ? 'locked' : ''} ${timeSliderActive ? 'timeslider-active' : ''}`}
        controls={<Fragment>
          <MapBaseLayerControl />
          <MapMarkerDropper onMarkerDropped={this.onReportMarkerDrop} />
          <MapRulerControl />
          <MapPrintControl />
          <MapSettingsControl />
          <TimeSliderMapControl />
        </Fragment>}
        onMoveStart={this.onMapMoveStart}
        onMoveEnd={this.onMapMoveEnd}
        onZoom={this.onMapZoom}
        onClick={this.onMapClick}
        onMapLoaded={this.setMap} >


        {map && (
          <Fragment>
            {children}

            <DelayedUnmount delay={100} isMounted={showReportsOnMap}>
              <EventsLayer
                enableClustering={enableEventClustering}
                events={mapEventFeatureCollection}
                mapImages={mapImages}
                onEventClick={this.onEventSymbolClick}
                onClusterClick={this.onClusterClick}
                bounceEventIDs={bounceEventIDs} />
            </DelayedUnmount>

            <MapImagesLayer map={map} />

            <UserCurrentLocationLayer onIconClick={this.onCurrentUserLocationClick} />

            <SubjectsLayer
              allowOverlap={timeSliderActive}
              mapImages={mapImages}
              subjects={nonStaticSubjects}
              subjectsOnActivePatrol={subjectsOnActivePatrol}
              onSubjectIconClick={this.onMapSubjectClick}
            />

            <StaticSensorsLayer staticSensors={staticSubjects} />

            <MessageBadgeLayer onBadgeClick={this.onMessageBadgeClick} />

            <DelayedUnmount isMounted={!this.props.userPreferences.sidebarOpen}>
              <div className='floating-report-filter'>
                <EventFilter className='report-filter'/>
              </div>
            </DelayedUnmount>


            <div className='map-legends'>
              {subjectTracksVisible && <SubjectTrackLegend onClose={this.onTrackLegendClose} />}
              {subjectHeatmapAvailable && <SubjectHeatmapLegend onClose={this.onSubjectHeatmapClose} />}
              {showReportHeatmap && <ReportsHeatmapLegend onClose={this.onCloseReportHeatmap} />}
              {patrolTracksVisible && <PatrolTrackLegend onClose={this.onPatrolTrackLegendClose} />}
              <span className='compass-wrapper' onClick={this.onRotationControlClick} >
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
                <CursorGpsDisplay />
              </span>
            </div>

            <RightClickMarkerDropper />

            {subjectHeatmapAvailable && <SubjectHeatLayer />}
            {showReportHeatmap && <ReportsHeatLayer />}

            {subjectTracksVisible && <TrackLayers showTimepoints={showTrackTimepoints} onPointClick={this.onTimepointClick} />}
            {patrolTracksVisible && <PatrolStartStopLayer />}

            {patrolTracksVisible && <PatrolTracks onPointClick={this.onTimepointClick} />}

            {/* uncomment the below coordinates and go southeast of seattle for a demo of the isochrone layer */}
            {/* <IsochroneLayer coords={[-122.01062903346423, 47.47666150363713]} /> */}

            <FeatureLayer symbols={symbolFeatures} lines={lineFeatures} polygons={fillFeatures} onFeatureSymbolClick={this.onFeatureSymbolClick} />

            <AnalyzerLayer warningLines={analyzerWarningLines} criticalLines={analyzerCriticalLines} warningPolys={analyzerWarningPolys}
              criticalPolys={analyzerCriticalPolys} layerGroups={layerGroups} onAnalyzerGroupEnter={this.onAnalyzerGroupEnter}
              onAnalyzerGroupExit={this.onAnalyzerGroupExit} onAnalyzerFeatureClick={this.onAnalyzerFeatureClick} map={map} />

            {!!popup && <PopupLayer
              popup={popup} />
            }

          </Fragment>
        )}

        {timeSliderActive && <TimeSlider />}
        <ReloadOnProfileChange />
        <SleepDetector onSleepDetected={this.onSleepDetected} />
      </EarthRangerMap>
    );
  }
}

const mapStatetoProps = (state, props) => {
  const { data, view } = state;
  const { maps, tracks, eventFilter, eventTypes } = data;
  const { hiddenAnalyzerIDs, hiddenFeatureIDs, homeMap, mapIsLocked, patrolTrackState, popup, subjectTrackState, heatmapSubjectIDs, timeSliderState, bounceEventIDs,
    showTrackTimepoints, trackLength: { length: trackLength, origin: trackLengthOrigin }, userPreferences, showReportsOnMap } = view;

  return ({
    analyzerFeatures: analyzerFeatures(state),
    maps,
    eventTypes,
    heatmapSubjectIDs,
    tracks,
    hiddenAnalyzerIDs,
    hiddenFeatureIDs,
    homeMap,
    mapIsLocked,
    patrolTrackState,
    popup,
    eventFilter,
    subjectTrackState,
    showTrackTimepoints,
    showReportsOnMap,
    timeSliderState,
    bounceEventIDs,
    trackLength,
    trackLengthOrigin,
    mapEventFeatureCollection: getMapEventFeatureCollectionWithVirtualDate(state),
    mapImages: state.view.mapImages,
    mapFeaturesFeatureCollection: getFeatureSetFeatureCollectionsByType(state),
    mapSubjectFeatureCollection: getMapSubjectFeatureCollectionWithVirtualPositioning(state),
    analyzersFeatureCollection: getAnalyzerFeatureCollectionsByType(state),
    userPreferences,
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
  toggleMapLockState,
  updateUserPreferences,
  updateTrackState,
  updatePatrolTrackState,
  updateHeatmapSubjects,
}
)(withMap(withRouter(Map)));

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
