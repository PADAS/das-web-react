import './Map.scss';
import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { REACT_APP_MAPBOX_TOKEN } from '../constants';
import { fetchMapSubjects } from '../ducks/subjects';
import { fetchMapEvents } from '../ducks/events';
import { fetchTracks } from '../ducks/tracks';
import { showPopup, hidePopup } from '../ducks/popup';
import { CancelToken } from 'axios';
import { addFeatureCollectionImagesToMap } from '../utils/map';
import debounce from 'lodash/debounce';
import uniq from 'lodash/uniq';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import createSocket, { unbindSocketEvents } from '../socket';
import ReactMapboxGl, { ZoomControl, RotationControl, ScaleControl } from 'react-mapbox-gl';
import { getMapEventFeatureCollection, getMapSubjectFeatureCollection, getArrayOfVisibleTracks } from '../selectors';
import { updateTrackState, updateHeatmapSubjects } from '../ducks/map-ui';
import isEqual from 'lodash/isEqual';

import EventsLayer from '../EventsLayer';
import SubjectsLayer from '../SubjectLayer';
import TrackLayers from '../TrackLayer';
import PopupLayer from '../PopupLayer';
import HeatLayer from '../HeatLayer';
import HeatmapLegend from '../HeatmapLegend';

const MapboxMap = ReactMapboxGl({
  accessToken: REACT_APP_MAPBOX_TOKEN,
  minZoom: 4,
  maxZoom: 18,
});

const mapConfig = {
  style: 'mapbox://styles/vjoelm/ciobuir0n0061bdnj1c54oakh',
};

let cancelToken = CancelToken.source();
const socket = createSocket();

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
  }

  shouldComponentUpdate(nextProps) {
    if (isEqual(this.props, nextProps)) return false;
    return true;
  }

  componentDidUpdate(prev) {
    if (!isEqual(prev.eventFilter, this.props.eventFilter)) {
      socket.emit('event_filter', this.props.eventFilter);
      this.fetchMapEvents();
    }
    if (!isEqual(prev.mapEventFeatureCollection, this.props.mapEventFeatureCollection)) {
      this.createMapImages(this.props.mapEventFeatureCollection);
    }
    if (!isEqual(prev.mapSubjectFeatureCollection, this.props.mapSubjectFeatureCollection)) {
      this.createMapImages(this.props.mapSubjectFeatureCollection);
    }
  }
  componentWillUnmount() {
    unbindSocketEvents(socket);
  }
  getMapCenter() {
    return (this.props.homeMap || this.props.maps.find(map => map.default)).center;
  }
  getMapZoom() {
    return [(this.props.homeMap || this.props.maps.find(map => map.default)).zoom];
  }
  onTimepointClick(layer) {
    const { geometry, properties } = layer;
    this.props.showPopup('timepoint', { geometry, properties });
  }
  renderTrackLayers() {
    const { trackCollection, map } = this.props;
    return !!trackCollection.length ? <TrackLayers onPointClick={this.onTimepointClick} trackCollection={trackCollection} map={map} /> : null;
  }
  renderHeatmapLayers() {
    const { trackCollection } = this.props;
    return !!trackCollection.length ? <Fragment>
      <HeatmapLegend onTrackRemoveButtonClick={this.toggleHeatmapState} onClose={() => updateHeatmapSubjects([])} tracks={trackCollection} />
      <HeatLayer trackCollection={trackCollection} />
    </Fragment> : null;
  }

  onMapMoveEnd() {
    cancelToken.cancel();
    cancelToken = CancelToken.source();
    this.fetchMapData();
  }
  fetchMapData() {
    this.fetchMapSubjects();
    this.fetchMapEvents();
  }
  fetchMapSubjects() {
    this.props.fetchMapSubjects(this.props.map, cancelToken);
  }
  fetchMapEvents() {
    this.props.fetchMapEvents(this.props.map, cancelToken);
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
    // spiderifier && spiderifier.unspiderfy();

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

  renderSubjectLayers() {
    const { mapSubjectFeatureCollection, map } = this.props;
    return <SubjectsLayer
      map={map}
      subjects={mapSubjectFeatureCollection}
      onSubjectIconClick={this.onMapSubjectClick}
    />;
  }
  render() {
    const { maps, map, popup, mapSubjectFeatureCollection, mapEventFeatureCollection, trackCollection } = this.props;
    const tracksAvailable = !!trackCollection.length;
    if (!maps.length) return null;

    const mapCenter = this.getMapCenter();
    return (
      <MapboxMap
        id='map'
        className='main-map'
        center={mapCenter}
        // zoom={this.getMapZoom()}
        onMoveEnd={debounce(this.onMapMoveEnd)}
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
            />;


            {tracksAvailable && <TrackLayers onPointClick={this.onTimepointClick} trackCollection={trackCollection} map={map} />}
            {tracksAvailable && <Fragment>
              <HeatmapLegend onTrackRemoveButtonClick={this.toggleHeatmapState} onClose={() => updateHeatmapSubjects([])} tracks={trackCollection} />
              <HeatLayer trackCollection={trackCollection} />
            </Fragment>}

            <EventsLayer map={map} events={mapEventFeatureCollection} onEventClick={(e) => console.log('event', e)} onClusterClick={this.onClusterClick} />

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
  const { maps, tracks } = data;
  const { homeMap, popup, eventFilter, subjectTrackState, heatmapSubjectIDs } = view;

  return ({
    maps,
    heatmapSubjectIDs,
    tracks,
    homeMap,
    popup,
    eventFilter,
    subjectTrackState,
    trackCollection: getArrayOfVisibleTracks(state, props),
    mapEventFeatureCollection: getMapEventFeatureCollection(data),
    mapSubjectFeatureCollection: getMapSubjectFeatureCollection({ data, view })
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
)(Map);

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