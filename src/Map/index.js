import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import debounce from 'lodash/debounce';
import uniq from 'lodash/uniq';
import isEqual from 'react-fast-compare';
import { CancelToken } from 'axios';
import differenceInCalendarDays from 'date-fns/difference_in_calendar_days';

import { fetchMapSubjects } from '../ducks/subjects';
import { fetchMapEvents } from '../ducks/events';
import { fetchBaseLayers } from '../ducks/layers';
import { TRACK_LENGTH_ORIGINS, setTrackLength } from '../ducks/tracks';
import { showPopup, hidePopup } from '../ducks/popup';
import { cleanUpBadlyStoredValuesFromMapSymbolLayer } from '../utils/map';
import { setAnalyzerFeatureActiveStateForIDs } from '../utils/analyzers';
import { openModalForReport } from '../utils/events';
import { fetchTracksIfNecessary } from '../utils/tracks';
import { getFeatureSetFeatureCollectionsByType } from '../selectors';
import { getArrayOfVisibleHeatmapTracks, displayedSubjectTrackIDs } from '../selectors/tracks';
import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../selectors/subjects';
import { getMapEventFeatureCollectionWithVirtualDate } from '../selectors/events';
import { trackEvent } from '../utils/analytics';
import { getAnalyzerFeaturesAtPoint } from '../utils/analyzers';
import { getAnalyzerFeatureCollectionsByType } from '../selectors';
import { updateTrackState, updateHeatmapSubjects, toggleMapLockState, setReportHeatmapVisibility } from '../ducks/map-ui';
import { addModal } from '../ducks/modals';

import { LAYER_IDS } from '../constants';

import withSocketConnection from '../withSocketConnection';
import EarthRangerMap from '../EarthRangerMap';
import EventsLayer from '../EventsLayer';
import SubjectsLayer from '../SubjectsLayer';
import TrackLayers from '../TracksLayer';
import FeatureLayer from '../FeatureLayer';
import AnalyzerLayer from '../AnalyzersLayer';
import PopupLayer from '../PopupLayer';
import SubjectHeatLayer from '../SubjectHeatLayer';
import UserCurrentLocationLayer from '../UserCurrentLocationLayer';
import SubjectHeatmapLegend from '../SubjectHeatmapLegend';
import TrackLegend from '../TrackLegend';
import EventFilter from '../EventFilter';
import FriendlyEventFilterString from '../EventFilter/FriendlyEventFilterString';
import TimeSlider from '../TimeSlider';
import TimeSliderMapControl from '../TimeSlider/TimeSliderMapControl';
import ReportsHeatLayer from '../ReportsHeatLayer';
import ReportsHeatmapLegend from '../ReportsHeatmapLegend';
import IsochroneLayer from '../IsochroneLayer';
import MapImagesLayer from '../MapImagesLayer';

import MapRulerControl from '../MapRulerControl';
import MapPrintControl from '../MapPrintControl';
import MapMarkerDropper from '../MapMarkerDropper';

import './Map.scss';
class Map extends Component {
  constructor(props) {
    super(props);
    this.setMap = this.setMap.bind(this);
    this.onMapMoveEnd = this.onMapMoveEnd.bind(this);
    this.onClusterClick = this.onClusterClick.bind(this);
    this.onMapClick = this.onMapClick.bind(this);
    this.onMapSubjectClick = this.onMapSubjectClick.bind(this);
    this.onTimepointClick = this.onTimepointClick.bind(this);
    this.onSubjectHeatmapClose = this.onSubjectHeatmapClose.bind(this);
    this.onTrackLegendClose = this.onTrackLegendClose.bind(this);
    this.onEventSymbolClick = this.onEventSymbolClick.bind(this);
    this.onFeatureSymbolClick = this.onFeatureSymbolClick.bind(this);
    this.onReportMarkerDrop = this.onReportMarkerDrop.bind(this);
    this.onCurrentUserLocationClick = this.onCurrentUserLocationClick.bind(this);
    this.onTrackLengthChange = this.onTrackLengthChange.bind(this);
    this.onCloseReportHeatmap = this.onCloseReportHeatmap.bind(this);
    this.trackRequestCancelToken = CancelToken.source();
    this.currentAnalyzerIds = [];
  }

  componentDidMount() {
    this.props.fetchBaseLayers();
  }

  componentDidUpdate(prev) {
    if (!this.props.map) return;

    if (!isEqual(prev.eventFilter, this.props.eventFilter)) {
      this.props.socket.emit('event_filter', this.props.eventFilter);
      this.fetchMapData();
      if (this.props.trackLengthOrigin === TRACK_LENGTH_ORIGINS.eventFilter
        && !isEqual(prev.eventFilter.filter.date_range, this.props.eventFilter.filter.date_range)) {
        this.setTrackLengthToEventFilterRange();
      }
    }
    if (!isEqual(prev.trackLengthOrigin, this.props.trackLengthOrigin) && this.props.trackLengthOrigin === TRACK_LENGTH_ORIGINS.eventFilter) {
      this.setTrackLengthToEventFilterRange();
    }
    if (!isEqual(prev.trackLength, this.props.trackLength)) {
      this.onTrackLengthChange();
    }
    if (!isEqual(prev.timeSliderState.active, this.props.timeSliderState.active) && this.props.timeSliderState.active) {
      this.fetchMapData();
    }
    if (!isEqual(this.props.showReportHeatmap, prev.showReportHeatmap) && this.props.showReportHeatmap) {
      this.onSubjectHeatmapClose();
    }
    if (!isEqual(this.props.heatmapTracks, prev.heatmapTracks) && !!this.props.heatmapTracks.length && this.props.showReportHeatmap) {
      this.onCloseReportHeatmap();
    }
    if (!!this.props.timeSliderState.active && !!this.props.popup
      && !isEqual(prev.timeSliderState.virtualDate, this.props.timeSliderState.virtualDate)
      && this.props.popup.type === 'subject') {
      const subjectMatch = this.props.mapSubjectFeatureCollection.features.find(item => item.properties.id === this.props.popup.data.properties.id);
      if (subjectMatch) {
        this.props.showPopup('subject', {
          geometry: subjectMatch.geometry,
          properties: subjectMatch.properties,
        });
      }
    }
  }
  setTrackLengthToEventFilterRange() {
    this.props.setTrackLength(differenceInCalendarDays(
      this.props.eventFilter.filter.date_range.upper || new Date(),
      this.props.eventFilter.filter.date_range.lower,
    ));
  }
  onTimepointClick(layer) {
    const { geometry, properties } = layer;
    this.props.showPopup('timepoint', { geometry, properties });
  }

  onMapMoveEnd = debounce((e) => {
    this.fetchMapData();
  }, 400);

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

  async fetchMapData() {
    await Promise.all([
      this.fetchMapEvents(),
      this.fetchMapSubjects(),
    ]);
    if (this.props.timeSliderState.active) {
      this.resetTrackRequestCancelToken();
      fetchTracksIfNecessary(this.props.mapSubjectFeatureCollection.features
        .filter(({ properties: { last_position_date } }) => (new Date(last_position_date) - new Date(this.props.eventFilter.filter.date_range.lower) >= 0))
        .map(({ properties: { id } }) => id), this.trackRequestCancelToken);
    }
  }
  fetchMapSubjects() {
    return this.props.fetchMapSubjects(this.props.map)
      .catch((e) => {
        // console.log('error fetching map subjects', e.__CANCEL__); handle errors here if not a cancelation
      });
  }
  fetchMapEvents() {
    return this.props.fetchMapEvents(this.props.map)
      .catch((e) => {
        // console.log('error fetching map events', e.__CANCEL__); handle errors here if not a cancelation
      });
  }
  onMapClick(map, event) {
    if (this.props.popup) {
      // XXX TD 
      if (this.props.popup.type === 'analyzer-config') {
        const { map } = this.props;
        setAnalyzerFeatureActiveStateForIDs(map, this.currentAnalyzerIds, false);
      }
      this.props.hidePopup(this.props.popup.id);
    }
    this.hideUnpinnedTrackLayers(map, event);
  }

  onEventSymbolClick({ properties }) {
    const { map } = this.props;
    const event = cleanUpBadlyStoredValuesFromMapSymbolLayer(properties);

    trackEvent('Map Interaction', 'Click Map Event Icon', `Event Type:${event.event_type}`);
    openModalForReport(event, map);
  }

  onFeatureSymbolClick(geometry, properties) {
    this.props.showPopup('feature-symbol', { geometry, properties });
    trackEvent('Map Interaction', 'Click Map Feature Symbol Icon', `Feature ID :${properties.id}`);
  }

  onAnalyzerGroupEnter = (e, groupIds) => {
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

  onAnalyzerFeatureClick = (e) => {
    const { map } = this.props;
    const features = getAnalyzerFeaturesAtPoint(map, e.point);
    setAnalyzerFeatureActiveStateForIDs(map, this.currentAnalyzerIds, true);
    const properties = features[0].properties;
    const geometry = e.lngLat;
    this.props.showPopup('analyzer-config', { geometry, properties });
  }

  hideUnpinnedTrackLayers(map, event) {
    const { updateTrackState, subjectTrackState: { visible } } = this.props;
    if (!visible.length) return;

    const clickedLayerIDs = map.queryRenderedFeatures(event.point)
      .filter(({ properties }) => !!properties && properties.id)
      .map(({ properties: { id } }) => id);

    return updateTrackState({
      visible: visible.filter(id => clickedLayerIDs.includes(id)),
    });
  }
  onCloseReportHeatmap() {
    this.props.setReportHeatmapVisibility(false);
  }
  onClusterClick(e) {
    const features = this.props.map.queryRenderedFeatures(e.point, { layers: [LAYER_IDS.EVENT_CLUSTERS_CIRCLES] });
    const clusterId = features[0].properties.cluster_id;
    const clusterSource = this.props.map.getSource('events-data-clustered');
    
    clusterSource.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;
      if (this.props.map.getZoom() >= zoom) {
        // clusterSource.getClusterLeaves(clusterId, 100, 0, (err, features) => {
        //   if (err) return;
        //   var markers = features.map(feature => feature.properties);
        //   spiderifier.spiderfy(features[0].geometry.coordinates, markers);
        // });
      } else {
        this.props.map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom
        });
      }
    });
  }

  onCurrentUserLocationClick(location) {
    this.props.showPopup('current-user-location', { location });
    trackEvent('Map Interaction', 'Click Current User Location Icon');
  }

  async onMapSubjectClick(layer) {
    const { geometry, properties } = layer;
    const { id, tracks_available } = properties;
    const { updateTrackState, subjectTrackState } = this.props;

    this.props.showPopup('subject', { geometry, properties });

    await (tracks_available) ? fetchTracksIfNecessary([id]) : new Promise((resolve, reject) => resolve());

    if (tracks_available) {
      updateTrackState({
        visible: [...subjectTrackState.visible, id]
      });
    }
    trackEvent('Map Interaction', 'Click Map Subject Icon', `Subject Type:${properties.subject_type}`);
  }

  setMap(map) {
    window.map = map;
    this.props.onMapLoad(map);
    this.onMapMoveEnd();
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

  onReportMarkerDrop(location) {
    this.props.showPopup('dropped-marker', { location });
  }

  onTrackLengthChange() {
    this.resetTrackRequestCancelToken();
    fetchTracksIfNecessary(uniq([...this.props.subjectTrackState.visible, ...this.props.subjectTrackState.pinned, ...this.props.heatmapSubjectIDs]), this.trackRequestCancelToken);
  }

  render() {
    const { children, maps, map, popup, mapSubjectFeatureCollection,
      mapEventFeatureCollection, homeMap, mapFeaturesFeatureCollection, analyzersFeatureCollection,
      trackIds, heatmapTracks, mapIsLocked, showTrackTimepoints, subjectTrackState, showReportsOnMap,
      timeSliderState: { active: timeSliderActive } } = this.props;

    const { showReportHeatmap } = this.props;

    const { symbolFeatures, lineFeatures, fillFeatures } = mapFeaturesFeatureCollection;

    const { analyzerWarningLines, analyzerCriticalLines,
      analyzerWarningPolys, analyzerCriticalPolys, layerGroups } = analyzersFeatureCollection;

    const tracksAvailable = !!trackIds && !!trackIds.length;

    const subjectHeatmapAvailable = !!heatmapTracks.length;
    const subjectTracksVisible = !!subjectTrackState.pinned.length || !!subjectTrackState.visible.length;
    if (!maps.length) return null;

    const enableEventClustering = timeSliderActive ? false : true;

    return (
      <EarthRangerMap
        center={homeMap.center}
        className={`main-map mapboxgl-map ${mapIsLocked ? 'locked' : ''} ${timeSliderActive ? 'timeslider-active' : ''}`}
        controls={<Fragment>
          <MapMarkerDropper onMarkerDropped={this.onReportMarkerDrop} />
          <MapRulerControl />
          <TimeSliderMapControl />
          <MapPrintControl />
        </Fragment>}
        onMoveEnd={this.onMapMoveEnd}
        onClick={this.onMapClick}
        onMapLoaded={this.setMap} >

        {children}

        {map && (
          <Fragment>

            <UserCurrentLocationLayer onIconClick={this.onCurrentUserLocationClick} />

            <SubjectsLayer
              allowOverlap={timeSliderActive}
              subjects={mapSubjectFeatureCollection}
              onSubjectIconClick={this.onMapSubjectClick}
            />

            <div className='floating-report-filter'>
              <EventFilter  />
              <FriendlyEventFilterString className='map-report-filter-details' />
            </div>


            <div className='map-legends'>
              {subjectHeatmapAvailable && <SubjectHeatmapLegend onClose={this.onSubjectHeatmapClose} />}
              {subjectTracksVisible && <TrackLegend onClose={this.onTrackLegendClose} />}
              {showReportHeatmap && <ReportsHeatmapLegend onClose={this.onCloseReportHeatmap} />}
            </div>

            {subjectHeatmapAvailable && <SubjectHeatLayer />}
            {showReportHeatmap && <ReportsHeatLayer />}

            {tracksAvailable && (
              <TrackLayers showTimepoints={showTrackTimepoints} onPointClick={this.onTimepointClick} trackIds={trackIds} />
            )}

            {/* uncomment the below coordinates and go southeast of seattle for a demo of the isochrone layer */}
            {/* <IsochroneLayer coords={[-122.01062903346423, 47.47666150363713]} /> */}

            {showReportsOnMap && <EventsLayer enableClustering={enableEventClustering} events={mapEventFeatureCollection} onEventClick={this.onEventSymbolClick} onClusterClick={this.onClusterClick} />}

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
        <MapImagesLayer />

      </EarthRangerMap>
    );
  }
}

const mapStatetoProps = (state, props) => {
  const { data, view } = state;
  const { maps, tracks, eventFilter } = data;
  const { homeMap, mapIsLocked, popup, subjectTrackState, heatmapSubjectIDs, timeSliderState,
    showTrackTimepoints, trackLength: { length: trackLength, origin: trackLengthOrigin }, showReportsOnMap } = view;

  return ({
    maps,
    heatmapSubjectIDs,
    tracks,
    homeMap,
    mapIsLocked,
    popup,
    eventFilter,
    subjectTrackState,
    showTrackTimepoints,
    showReportsOnMap,
    timeSliderState,
    trackIds: displayedSubjectTrackIDs(state),
    trackLength,
    trackLengthOrigin,
    heatmapTracks: getArrayOfVisibleHeatmapTracks(state, props),
    mapEventFeatureCollection: getMapEventFeatureCollectionWithVirtualDate(state),
    mapImages: state.view.mapImages,
    mapFeaturesFeatureCollection: getFeatureSetFeatureCollectionsByType(state),
    mapSubjectFeatureCollection: getMapSubjectFeatureCollectionWithVirtualPositioning(state),
    analyzersFeatureCollection: getAnalyzerFeatureCollectionsByType(state),
    showReportHeatmap: state.view.showReportHeatmap,
  });
};

export default connect(mapStatetoProps, {
  fetchBaseLayers,
  fetchMapSubjects,
  fetchMapEvents,
  hidePopup,
  addModal,
  setReportHeatmapVisibility,
  setTrackLength,
  showPopup,
  toggleMapLockState,
  updateTrackState,
  updateHeatmapSubjects,
}
)(withSocketConnection(Map));

// Map.whyDidYouRender = true;

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
