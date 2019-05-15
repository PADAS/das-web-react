import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { CancelToken } from 'axios';
import debounce from 'lodash/debounce';
import ReactMapboxGl, { ZoomControl, RotationControl, ScaleControl } from 'react-mapbox-gl';
import isEqual from 'react-fast-compare';
import debounceRender from 'react-debounce-render';

import { REACT_APP_MAPBOX_TOKEN } from '../constants';
import { fetchMapSubjects } from '../ducks/subjects';
import { fetchMapEvents } from '../ducks/events';
import { fetchTracks } from '../ducks/tracks';
import { showPopup, hidePopup } from '../ducks/popup';
import { addFeatureCollectionImagesToMap } from '../utils/map';
import createSocket, { unbindSocketEvents } from '../socket';
import { getMapEventFeatureCollection, getMapSubjectFeatureCollection, getArrayOfVisibleTracks, getArrayOfVisibleHeatmapTracks, getFeatureSetFeatureCollectionsByType } from '../selectors';
import { updateTrackState, updateHeatmapSubjects } from '../ducks/map-ui';
import EventsLayer from '../EventsLayer';
import SubjectsLayer from '../SubjectLayer';
import TrackLayers from '../TrackLayer';
import FeatureLayer from '../FeatureLayer';
import PopupLayer from '../PopupLayer';
import HeatLayer from '../HeatLayer';
import HeatmapLegend from '../HeatmapLegend';

import 'mapbox-gl/dist/mapbox-gl.css';
// import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import './Map.scss';

const MapboxMap = ReactMapboxGl({
  accessToken: REACT_APP_MAPBOX_TOKEN,
  minZoom: 4,
  maxZoom: 18,
});

const mapConfig = {
  style: 'mapbox://styles/vjoelm/ciobuir0n0061bdnj1c54oakh',
};

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
  }

  cancelToken = CancelToken.source();

  shouldComponentUpdate(nextProps) {
    return !isEqual(this.props, nextProps);
  }

  componentDidMount() {
    this.socket = createSocket();
  }

  componentDidUpdate(prev) {
    if (!this.props.map) return;

    if (!isEqual(prev.eventFilter, this.props.eventFilter)) {
      this.socket.emit('event_filter', this.props.eventFilter);
      this.onMapMoveEnd();
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
  componentWillUnmount() {
    unbindSocketEvents(this.socket);
  }

  onTimepointClick(layer) {
    const { geometry, properties } = layer;
    this.props.showPopup('timepoint', { geometry, properties });
  }

  onMapMoveEnd = debounce((e) => {
    this.cancelToken.cancel();
    this.cancelToken = CancelToken.source();
    this.fetchMapData();
  }, 500)
  
  fetchMapData() {
    this.fetchMapSubjects();
    this.fetchMapEvents();
  }
  fetchMapSubjects() {
    this.props.fetchMapSubjects(this.props.map, this.cancelToken);
  }
  fetchMapEvents() {
    this.props.fetchMapEvents(this.props.map, this.cancelToken);
  }
  onMapClick(map, event) {
    if (this.props.popup) {
      this.props.hidePopup(this.props.popup.id)
    }
    this.hideUnpinnedTrackLayers(map, event);
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
    const features = this.props.map.queryRenderedFeatures(e.point, { layers: ['event_clusters-circle'] });
    const clusterId = features[0].properties.cluster_id;
    const clusterSource = this.props.map.getSource('event_clusters');

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
  toggleTrackState(id) {
    const { subjectTrackState: { visible, pinned }, updateTrackState } = this.props;

    if (pinned.includes(id)) {
      return updateTrackState({
        pinned: pinned.filter(item => item !== id),
        visible: visible.filter(item => item !== id),
      });
    }
    if (visible.includes(id)) {
      return updateTrackState({
        pinned: [...pinned, id],
        visible: visible.filter(item => item !== id),
      });
    }
    return updateTrackState({
      visible: [...visible, id],
    });
  }
  toggleHeatmapState(id) {
    const { heatmapSubjectIDs, updateHeatmapSubjects } = this.props;
    const visible = heatmapSubjectIDs.includes(id);

    if (visible) {
      return updateHeatmapSubjects(heatmapSubjectIDs.filter(item => item !== id));
    }
    return updateHeatmapSubjects([...heatmapSubjectIDs, id]);
  }
  async createMapImages(featureCollection) {
    const newImages = await addFeatureCollectionImagesToMap(featureCollection, this.props.map);
    
    if (newImages.length) {
      // a fake flyTo coerces the map to load symbol images
      setTimeout(() => {
        this.props.map.flyTo({
          center: this.props.map.getCenter(),
        });
      }, 200);
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

  }
  setMap(map) {
    this.props.onMapLoad(map);
    this.onMapMoveEnd();
  }

  onHeatmapClose() {
    this.props.updateHeatmapSubjects([]);
  }

  render() {
    const { maps, map, popup, mapSubjectFeatureCollection, mapEventFeatureCollection, homeMap, mapFeaturesFeatureCollection, trackCollection, heatmapTracks } = this.props;
    const { symbolFeatures, lineFeatures, fillFeatures } = mapFeaturesFeatureCollection;

    const tracksAvailable = !!trackCollection.length;
    const heatmapAvailable = !! heatmapTracks.length;
    if (!maps.length) return null;

    return (
      <MapboxMap
        id='map'
        center={homeMap.center}
        className='main-map'
        onMoveEnd={this.onMapMoveEnd}
        movingMethod={'easeTo'}
        onClick={this.onMapClick}
        onStyleLoad={this.setMap}
        {...mapConfig}>

        {map && (
          <Fragment>
            <SubjectsLayer
              map={map}
              subjects={mapSubjectFeatureCollection}
              onSubjectIconClick={this.onMapSubjectClick}
            />
            {tracksAvailable && <TrackLayers onPointClick={this.onTimepointClick} trackCollection={trackCollection} map={map} />}
            {heatmapAvailable && <Fragment>
              <HeatmapLegend onTrackRemoveButtonClick={this.toggleHeatmapState} onClose={this.onHeatmapClose} tracks={heatmapTracks} />
              <HeatLayer />
            </Fragment>}

            <EventsLayer map={map} events={mapEventFeatureCollection} onEventClick={(e) => console.log('event', e)} onClusterClick={this.onClusterClick} />

            <FeatureLayer symbols={symbolFeatures} lines={lineFeatures} polygons={fillFeatures} />

            {!!popup && <PopupLayer
              popup={popup}
              map={map}
              onTrackToggle={this.toggleTrackState}
              onHeatmapToggle={this.toggleHeatmapState}
              heatmapState={this.props.heatmapSubjectIDs}
              trackState={this.props.subjectTrackState} />
            }

            <RotationControl position='bottom-left' />
            <ScaleControl className="mapbox-scale-ctrl" position='bottom-right' />
            <ZoomControl className="mapbox-zoom-ctrl" position='bottom-right' />
            {/* <DrawControl map={map} position='bottom-left' /> */}
          </Fragment>
        )}

      </MapboxMap>
    )
  }
}

const mapStatetoProps = (state, props) => {
  const { data, view } = state;
  const { maps, tracks, eventFilter } = data;
  const { homeMap, popup, subjectTrackState, heatmapSubjectIDs } = view;

  return ({
    maps,
    heatmapSubjectIDs,
    tracks,
    homeMap,
    popup,
    eventFilter,
    subjectTrackState,
    trackCollection: getArrayOfVisibleTracks(state, props),
    heatmapTracks: getArrayOfVisibleHeatmapTracks(state, props),
    mapEventFeatureCollection: getMapEventFeatureCollection(state),
    mapFeaturesFeatureCollection: getFeatureSetFeatureCollectionsByType(state),
    mapSubjectFeatureCollection: getMapSubjectFeatureCollection(state)
  });
};

export default connect(mapStatetoProps, {
  fetchMapSubjects,
  fetchMapEvents,
  fetchTracks,
  hidePopup,
  showPopup,
  updateTrackState,
  updateHeatmapSubjects,
}
)(debounceRender(Map, 100));

Map.whyDidYouRender = true;

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