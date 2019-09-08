import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import debounce from 'lodash/debounce';
import isEqual from 'react-fast-compare';
import debounceRender from 'react-debounce-render';

import { fetchMapSubjects } from '../ducks/subjects';
import { fetchMapEvents } from '../ducks/events';
import { fetchBaseLayers } from '../ducks/layers';
import { fetchTracks } from '../ducks/tracks';
import { showPopup, hidePopup } from '../ducks/popup';
import { addFeatureCollectionImagesToMap, cleanUpBadlyStoredValuesFromMapSymbolLayer } from '../utils/map';
import { openModalForReport } from '../utils/events';
import { trackEvent } from '../utils/analytics';
import {
  getMapEventFeatureCollection, getMapSubjectFeatureCollection, getArrayOfVisibleTracks,
  getArrayOfVisibleHeatmapTracks, getFeatureSetFeatureCollectionsByType, getAnalyzerFeatureCollectionsByType
} from '../selectors';
import { updateTrackState, updateHeatmapSubjects, toggleMapLockState } from '../ducks/map-ui';
import { addModal } from '../ducks/modals';

import { LAYER_IDS } from '../constants';

import withSocketConnection from '../withSocketConnection';
import EarthRangerMap from '../EarthRangerMap';
import EventsLayer from '../EventsLayer';
import SubjectsLayer from '../SubjectLayer';
import TrackLayers from '../TrackLayer';
import FeatureLayer from '../FeatureLayer';
import AnalyzerLayer from '../AnalyzersLayer';
import PopupLayer from '../PopupLayer';
import SubjectHeatLayer from '../SubjectHeatLayer';
import UserCurrentLocationLayer from '../UserCurrentLocationLayer';
import SubjectHeatmapLegend from '../SubjectHeatmapLegend';
import FriendlyEventFilterString from '../EventFilter/FriendlyEventFilterString';

import MapRulerControl from '../MapRulerControl';
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
    this.toggleTrackState = this.toggleTrackState.bind(this);
    this.toggleHeatmapState = this.toggleHeatmapState.bind(this);
    this.onHeatmapClose = this.onHeatmapClose.bind(this);
    this.onEventSymbolClick = this.onEventSymbolClick.bind(this);
    this.onReportMarkerDrop = this.onReportMarkerDrop.bind(this);
    this.onCurrentUserLocationClick = this.onCurrentUserLocationClick.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    return !isEqual(this.props, nextProps);
  }

  componentDidMount() {
    this.props.fetchBaseLayers();
  }

  componentDidUpdate(prev) {
    if (!this.props.map) return;

    if (!isEqual(prev.eventFilter, this.props.eventFilter)) {
      this.props.socket.emit('event_filter', this.props.eventFilter);
      this.fetchMapData();
    }

    if (!isEqual(prev.mapEventFeatureCollection, this.props.mapEventFeatureCollection)) {
      this.createEventImages();
    }
    if (!isEqual(prev.mapSubjectFeatureCollection, this.props.mapSubjectFeatureCollection)) {
      this.createSubjectImages();
    }
    if (!isEqual(prev.mapFeaturesFeatureCollection.symbolFeatures, this.props.mapFeaturesFeatureCollection.symbolFeatures)) {
      this.createFeatureImages();
    }
  }
  createSubjectImages() {
    this.createMapImages(this.props.mapSubjectFeatureCollection);
  }
  createEventImages() {
    this.createMapImages(this.props.mapEventFeatureCollection);
  }
  createFeatureImages() {
    this.createMapImages(this.props.mapFeaturesFeatureCollection.symbolFeatures);
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

  fetchMapData() {
    this.fetchMapSubjects();
    this.fetchMapEvents();
  }
  fetchMapSubjects() {
    this.props.fetchMapSubjects(this.props.map);
  }
  fetchMapEvents() {
    this.props.fetchMapEvents(this.props.map);
  }
  onMapClick(map, event) {
    if (this.props.popup) {
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
  onClusterClick(e) {
    const features = this.props.map.queryRenderedFeatures(e.point, { layers: [LAYER_IDS.EVENT_CLUSTERS_CIRCLES] });
    const clusterId = features[0].properties.cluster_id;
    const clusterSource = this.props.map.getSource('events-data');

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
    this.props.showPopup('current-user-location', { location } );
    trackEvent('Map Interaction', 'Click Current User Location Icon');
  }

  toggleTrackState(id) {
    const { subjectTrackState: { visible, pinned }, updateTrackState } = this.props;

    if (pinned.includes(id)) {
      trackEvent('Map Interaction', 'Uncheck Subject Show Tracks button');
      return updateTrackState({
        pinned: pinned.filter(item => item !== id),
        visible: visible.filter(item => item !== id),
      });
    }
    if (visible.includes(id)) {
      trackEvent('Map Interaction', 'Pin Subject Show Tracks button');
      return updateTrackState({
        pinned: [...pinned, id],
        visible: visible.filter(item => item !== id),
      });
    }
    trackEvent('Map Interaction', 'Check Subject Show Tracks button');
    return updateTrackState({
      visible: [...visible, id],
    });
  }
  toggleHeatmapState(id) {
    const { heatmapSubjectIDs, updateHeatmapSubjects } = this.props;
    const visible = heatmapSubjectIDs.includes(id);

    if (visible) {
      trackEvent('Map Interaction', 'Uncheck Subject Heatmap button');
      return updateHeatmapSubjects(heatmapSubjectIDs.filter(item => item !== id));
    } else {
      trackEvent('Map Interaction', 'Check Subject Heatmap button');
      return updateHeatmapSubjects([...heatmapSubjectIDs, id]);
    }
  }
  async createMapImages(featureCollection) {
    const newImages = await addFeatureCollectionImagesToMap(featureCollection, this.props.map);

    if (newImages.length) {
      setTimeout(() => {
        this.props.map.flyTo({
          center: this.props.map.getCenter(),
        });
      });
    }
  }
  async onMapSubjectClick(layer) {
    const { geometry, properties } = layer;
    const { id, tracks_available } = properties;
    const { updateTrackState, subjectTrackState } = this.props;

    this.props.showPopup('subject', { geometry, properties });

    await (tracks_available) ? this.props.fetchTracks(id) : new Promise((resolve, reject) => resolve());

    if (tracks_available) {
      updateTrackState({
        visible: [...subjectTrackState.visible, id]
      });
    }
    trackEvent('Map Interaction', 'Click Map Subject Icon', `Subject Type:${properties.subject_type}`);
  }
  setMap(map) {
    console.log('set map');
    this.props.onMapLoad(map);
    this.onMapMoveEnd();
  }

  onHeatmapClose() {
    this.props.updateHeatmapSubjects([]);
  }

  onReportMarkerDrop(location) {
    this.props.showPopup('dropped-marker', { location });
  }

  render() {
    const { children, maps, map, popup, mapSubjectFeatureCollection,
      mapEventFeatureCollection, homeMap, mapFeaturesFeatureCollection, analyzersFeatureCollection,
      trackCollection, heatmapTracks, mapIsLocked, showTrackTimepoints } = this.props;

    const { symbolFeatures, lineFeatures, fillFeatures } = mapFeaturesFeatureCollection;
    const { analyzerWarningLines, analyzerCriticalLines, 
      analyzerWarningPolys, analyzerCriticalPolys, layerGroups } = analyzersFeatureCollection;

    const tracksAvailable = !!trackCollection.length;
    const subjectHeatmapAvailable = !!heatmapTracks.length;
    if (!maps.length) return null;

    return (
      <EarthRangerMap
        center={homeMap.center}
        className={`main-map mapboxgl-map ${mapIsLocked ? 'locked' : ''}`}
        onMoveEnd={this.onMapMoveEnd}
        onClick={this.onMapClick}
        onMapLoaded={this.setMap} >

        {children}

        {map && (
          <Fragment>
            
            <UserCurrentLocationLayer onIconClick={this.onCurrentUserLocationClick} />

            <SubjectsLayer
              subjects={mapSubjectFeatureCollection}
              onSubjectIconClick={this.onMapSubjectClick}
            />
            <div className='map-legends'>
              <FriendlyEventFilterString className='event-filter-details' />
              {subjectHeatmapAvailable && <SubjectHeatmapLegend onClose={this.onHeatmapClose} />}
            </div>

            {subjectHeatmapAvailable && <SubjectHeatLayer />}

            {tracksAvailable && <TrackLayers showTimepoints={showTrackTimepoints} onPointClick={this.onTimepointClick} trackCollection={trackCollection} />}

            <EventsLayer events={mapEventFeatureCollection} onEventClick={this.onEventSymbolClick} onClusterClick={this.onClusterClick} />

            <FeatureLayer symbols={symbolFeatures} lines={lineFeatures} polygons={fillFeatures} />

            <AnalyzerLayer warningLines={analyzerWarningLines} criticalLines={analyzerCriticalLines} warningPolys={analyzerWarningPolys} 
              criticalPolys={analyzerCriticalPolys}layerGroups={layerGroups} map={map} />

            {!!popup && <PopupLayer
              popup={popup}
              onTrackToggle={this.toggleTrackState}
              onHeatmapToggle={this.toggleHeatmapState}
              heatmapState={this.props.heatmapSubjectIDs}
              trackState={this.props.subjectTrackState} />
            }
            <MapMarkerDropper onMarkerDropped={this.onReportMarkerDrop} />
            <MapRulerControl />
          </Fragment>
        )}

      </EarthRangerMap>
    );
  }
}

const mapStatetoProps = (state, props) => {
  const { data, view } = state;
  const { maps, tracks, eventFilter } = data;
  const { homeMap, mapIsLocked, popup, subjectTrackState, heatmapSubjectIDs, showTrackTimepoints } = view;

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
    trackCollection: getArrayOfVisibleTracks(state, props),
    heatmapTracks: getArrayOfVisibleHeatmapTracks(state, props),
    mapEventFeatureCollection: getMapEventFeatureCollection(state),
    mapFeaturesFeatureCollection: getFeatureSetFeatureCollectionsByType(state),
    mapSubjectFeatureCollection: getMapSubjectFeatureCollection(state),
    analyzersFeatureCollection: getAnalyzerFeatureCollectionsByType(state),
  });
};

export default connect(mapStatetoProps, {
  fetchBaseLayers,
  fetchMapSubjects,
  fetchMapEvents,
  fetchTracks,
  hidePopup,
  addModal,
  showPopup,
  toggleMapLockState,
  updateTrackState,
  updateHeatmapSubjects,
}
)(debounceRender(withSocketConnection(Map), 100));

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
