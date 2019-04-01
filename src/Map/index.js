import './Map.scss';
import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { REACT_APP_MAPBOX_TOKEN } from '../constants';
import { fetchMapSubjects } from '../ducks/subjects';
import { fetchMapEvents } from '../ducks/events';
import { fetchTracks } from '../ducks/tracks';
import { showPopup, hidePopup } from '../ducks/map-ui';
import { CancelToken } from 'axios';
import { addFeatureCollectionImagesToMap } from '../utils/map';
import debounce from 'lodash/debounce';
import set from 'lodash/set';
import uniq from 'lodash/uniq';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import createSocket, { unbindSocketEvents } from '../socket';
import ReactMapboxGl, { ZoomControl, RotationControl } from 'react-mapbox-gl';
import { getMapEventFeatureCollection, getMapSubjectFeatureCollection } from '../selectors';

import EventsLayer from '../EventsLayer';
import SubjectsLayer from '../SubjectLayer';
import TrackLayers from '../TrackLayer';
import PopupLayer from '../PopupLayer';
import HeatLayer from '../HeatLayer';

const MapboxMap = ReactMapboxGl({
  accessToken: REACT_APP_MAPBOX_TOKEN,
  minZoom: 4,
  maxZoom: 18,
});

class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mapConfig: {
        style: 'mapbox://styles/vjoelm/ciobuir0n0061bdnj1c54oakh',
      },
      map: null,
      mapDataLoadingCancelToken: null,
      visibleTrackIDs: [],
      pinnedTrackIDs: [],
      heatmapIDs: [],
      socket: null,
    };
    this.setMap = this.setMap.bind(this);
    this.onMapMoveEnd = this.onMapMoveEnd.bind(this);
    this.onClusterClick = this.onClusterClick.bind(this);
    this.onMapClick = this.onMapClick.bind(this);
    this.onMapSubjectClick = this.onMapSubjectClick.bind(this);
    this.onTimepointClick = this.onTimepointClick.bind(this);
    this.toggleTrackState = this.toggleTrackState.bind(this);
    this.toggleHeatmapState = this.toggleHeatmapState.bind(this);
  }
  componentDidMount() {
    this.setState({
      socket: createSocket(),
    });
  }
  componentWillUnmount() {
    unbindSocketEvents(this.state.socket);
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
    const trackLayerState = uniq([...this.state.visibleTrackIDs, ...this.state.pinnedTrackIDs]);
    if (!trackLayerState.length) return null;

    const trackCollection = trackLayerState
      .filter(id => !!this.props.tracks[id])
      .map(id => (this.props.tracks[id]));

    if (!trackCollection.length) return null;

    return <TrackLayers onPointClick={this.onTimepointClick} trackCollection={trackCollection} map={this.state.map} />;
  }
  renderHeatmapLayers() {
    const { heatmapIDs } = this.state;

    if (!heatmapIDs.length) return null;

    const trackCollection = heatmapIDs
      .filter(id => !!this.props.tracks[id])
      .map(id => (this.props.tracks[id]));

    if (!trackCollection.length) return null;

    return <HeatLayer trackCollection={trackCollection} />

  }

  onMapMoveEnd() {
    if (this.state.mapDataLoadingCancelToken) {
      this.state.mapDataLoadingCancelToken.cancel();
    }
    this.setState({
      mapDataLoadingCancelToken: CancelToken.source(),
    });
    this.fetchMapData();
  }
  fetchMapData() {
    this.fetchMapSubjects();
    this.fetchMapEvents();
  }
  fetchMapSubjects() {
    this.props.fetchMapSubjects(this.state.map, this.state.mapDataLoadingCancelToken);
  }
  fetchMapEvents() {
    this.props.fetchMapEvents(this.state.map, this.state.mapDataLoadingCancelToken);
  }
  onMapClick(map, event) {
    if (!this.state.map) return;
    if (this.props.popup) {
      this.props.hidePopup(this.props.popup.id)
    }
    this.hideUnpinnedTrackLayers(event);
  }
  hideUnpinnedTrackLayers(event) {
    if (!this.state.visibleTrackIDs.length) return;

    const clickedLayerIDs = this.state.map.queryRenderedFeatures(event.point)
      .filter(({ properties }) => !!properties && properties.id)
      .map(({ properties: { id } }) => id);

    return this.setState({
      visibleTrackIDs: this.state.visibleTrackIDs.filter(id => clickedLayerIDs.includes(id)),
    });
  }
  onClusterClick(e) {
    // spiderifier && spiderifier.unspiderfy();

    const features = this.state.map.queryRenderedFeatures(e.point, { layers: ['event_clusters-circle'] });
    const clusterId = features[0].properties.cluster_id;
    const clusterSource = this.state.map.getSource('event_clusters');

    clusterSource.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;
      if (this.state.map.getZoom() >= zoom) {
        // clusterSource.getClusterLeaves(clusterId, 100, 0, (err, features) => {
        //   if (err) return;
        //   var markers = features.map(feature => feature.properties);
        //   spiderifier.spiderfy(features[0].geometry.coordinates, markers);
        // });
      } else {
        this.state.map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom
        });
      }
    });
  }
  toggleTrackState(id) {
    const { pinnedTrackIDs, visibleTrackIDs } = this.state;
    const pinned = pinnedTrackIDs.includes(id);
    const visible = visibleTrackIDs.includes(id);

    if (pinned) {
      return this.setState({
        pinnedTrackIDs: pinnedTrackIDs.filter(item => item !== id),
        visibleTrackIDs: visibleTrackIDs.filter(item => item !== id),
      });
    }
    if (visible) {
      return this.setState({
        pinnedTrackIDs: [...pinnedTrackIDs, id],
        visibleTrackIDs: visibleTrackIDs.filter(item => item !== id),
      });
    }
    return this.setState({
      visibleTrackIDs: [...visibleTrackIDs, id],
    });
  }
  toggleHeatmapState(id) {
    const { heatmapIDs } = this.state;
    const visible = heatmapIDs.includes(id);

    if (visible) {
      return this.setState({
        heatmapIDs: heatmapIDs.filter(item => item !== id),
      });
    }
    return this.setState({
      heatmapIDs: [...heatmapIDs, id],
    });
  }
  async createMapImages(featureCollection) {
    const newImages = await addFeatureCollectionImagesToMap(featureCollection, this.state.map);

    if (newImages.length) {
      setTimeout(this.state.map.triggerRepaint, 200);
    }
  }
  async onMapSubjectClick(layer) {
    const { geometry, properties } = layer;
    const { id, tracks_available } = properties;

    this.props.showPopup('subject', { geometry, properties });

    await (tracks_available) ? this.props.fetchTracks(id) : new Promise((resolve, reject) => resolve());

    if (tracks_available) {
      this.setState({
        visibleTrackIDs: [...this.state.visibleTrackIDs, id]
      });
    }

  }
  setMap(map) {
    this.setState({
      map,
    });
    window.map = map;
    this.onMapMoveEnd();
    // spiderifier = new MapboxglSpiderifier(this.state.map, {
    //   onClick: function (e, spiderLeg) {
    //   },
    //   markerWidth: 40,
    //   markerHeight: 40,
    // });
  }
  renderEventLayers() {
    this.createMapImages(this.props.mapEventFeatureCollection);
    return <EventsLayer map={this.state.map} events={this.props.mapEventFeatureCollection} onEventClick={(e) => console.log('event', e)} onClusterClick={this.onClusterClick} />
  }
  renderSubjectLayers() {
    this.createMapImages(this.props.mapSubjectFeatureCollection);
    return <SubjectsLayer
      map={this.state.map}
      subjects={this.props.mapSubjectFeatureCollection}
      onSubjectIconClick={this.onMapSubjectClick}
    />;
  }
  render() {
    if (!this.props.maps.length) return null;
    return (
      <MapboxMap
        id='map'
        className='main-map'
        center={this.getMapCenter()}
        // zoom={this.getMapZoom()}
        onMoveEnd={debounce(this.onMapMoveEnd)}
        movingMethod={'easeTo'}
        onClick={this.onMapClick}
        onStyleLoad={this.setMap}
        {...this.state.mapConfig}>

        {this.state.map && (
          <Fragment>
            {this.renderSubjectLayers()}
            {this.renderTrackLayers()}
            {this.renderHeatmapLayers()}
            {this.renderEventLayers()}

            {!!this.props.popup && <PopupLayer
              popup={this.props.popup}
              onTrackToggle={this.toggleTrackState}
              onHeatmapToggle={this.toggleHeatmapState}
              heatmapState={this.state.heatmapIDs}
              trackState={{
                visible: this.state.visibleTrackIDs,
                pinned: this.state.pinnedTrackIDs,
              }} />
            }

            <RotationControl position='top-left' />
            <ZoomControl position='bottom-right' />
            {/* <DrawControl map={this.state.map} position='bottom-left' /> */}
          </Fragment>
        )}

      </MapboxMap>
    )
  }
}

const mapStatetoProps = ({ data, view: { homeMap, popup } }) => {
  const { mapSubjects, mapEvents, maps, tracks } = data;
  return { maps, mapSubjects, mapEvents, tracks, homeMap, popup, mapEventFeatureCollection: getMapEventFeatureCollection(data), mapSubjectFeatureCollection: getMapSubjectFeatureCollection(data) };
};

export default connect(mapStatetoProps, { fetchMapSubjects, fetchMapEvents, fetchTracks, hidePopup, showPopup })(Map);

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