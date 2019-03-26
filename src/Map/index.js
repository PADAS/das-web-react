import './Map.css';
import React, { Component, createRef, Fragment } from 'react';
import { connect } from 'react-redux';
import { REACT_APP_MAPBOX_TOKEN } from '../constants';
import { fetchMapSubjects } from '../ducks/subjects';
import { fetchMapEvents } from '../ducks/events';
import { fetchTracks } from '../ducks/tracks';
import { CancelToken } from 'axios';
import { addFeatureCollectionImagesToMap } from '../utils/map';
import debounce from 'lodash/debounce';
import set from 'lodash/set';
import uniq from 'lodash/uniq';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapboxgl-spiderifier/index.css';
import MapboxglSpiderifier from 'mapboxgl-spiderifier';
import createSocket, { unbindSocketEvents } from '../socket';
import ReactMapboxGl, { ZoomControl, RotationControl, GeoJSONLayer, Marker, Source } from 'react-mapbox-gl';
// import DrawControl from 'react-mapbox-gl-draw/lib';
import { getMapEventFeatureCollection, getMapSubjectFeatureCollection } from '../selectors';

import EventsLayer from '../EventsLayer';
import SubjectsLayer from '../SubjectLayer';
import TrackLayer from '../TrackLayer';

let spiderifier;

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
      layers: {
        tracks: {
          visibleIDs: [],
          pinnedIDs: [],
        },
      },
      socket: null,
    };
    this.mapRef = createRef();
    this.setMap = this.setMap.bind(this);
    this.onMapMoveEnd = this.onMapMoveEnd.bind(this);
    this.onClusterClick = this.onClusterClick.bind(this);
    this.onMapClick = this.onMapClick.bind(this);
    this.onMapSubjectClick = this.onMapSubjectClick.bind(this);
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
  renderTrackLayers() {
    const trackCollection = uniq([...this.state.layers.tracks.visibleIDs, ...this.state.layers.tracks.pinnedIDs])
      .filter(id => !!this.props.tracks[id])
      .map(id => ({ id, tracks: this.props.tracks[id] }));

    if (!trackCollection.length) return null;

    return trackCollection.map((feature) => <TrackLayer map={this.state.map} key={`${feature.id}-tracks`} id={feature.id} tracks={feature.tracks} />);
  }
  renderSubjectMarkers() {
    if (this.props.mapSubjects.length) return this.props.mapSubjects.map(subject => (
      <Marker
        key={subject.id}
        coordinates={subject.last_position.geometry.coordinates}
        anchor='top-left'
      >
        <img className='subject-marker-icon' src={subject.last_position.properties.image} />
        <h5>{subject.name}</h5>
      </Marker>
    ));
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
    spiderifier && spiderifier.unspiderfy();
    this.hideUnpinnedTrackLayers(event);
  }
  hideUnpinnedTrackLayers(event) {
    if (!this.state.layers.tracks.visibleIDs) return;

    const clickedLayerIDs = this.state.map.queryRenderedFeatures(event.point)
      .filter(({ properties }) => !!properties && properties.id)
      .map(({ properties: { id } }) => id);

    return this.setState(prevState => uniq(set(
      prevState,
      ['layers', 'tracks', 'visibleIDs'],
      this.state.layers.tracks.visibleIDs.filter(id => clickedLayerIDs.includes(id)),
    )));
  }
  onClusterClick(e) {
    spiderifier && spiderifier.unspiderfy();

    const features = this.state.map.queryRenderedFeatures(e.point, { layers: ['event_clusters-circle'] });
    const clusterId = features[0].properties.cluster_id;
    const clusterSource = this.state.map.getSource('event_clusters');

    clusterSource.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;
      if (this.state.map.getZoom() >= zoom) {
        clusterSource.getClusterLeaves(clusterId, 100, 0, (err, features) => {
          if (err) return;
          var markers = features.map(feature => feature.properties);
          spiderifier.spiderfy(features[0].geometry.coordinates, markers);
        });
      } else {
        this.state.map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom
        });
      }
    });
  }
  async createMapImages(featureCollection) {
    await addFeatureCollectionImagesToMap(featureCollection, this.state.map);

    debounce(this.forceUpdate, 1500);
  }
  async onMapSubjectClick(e) {
    const [{ properties }] = this.state.map.queryRenderedFeatures(e.point, { layers: ['subject_symbols-symbol'] });
    const { id, tracks_available } = properties;

    if (!tracks_available) return;

    await this.props.fetchTracks(id);

    return this.setState(prevState => uniq(set(
      prevState,
      ['layers', 'tracks', 'visibleIDs'],
      [...this.state.layers.tracks.visibleIDs, id],
    )));
  }
  setMap(map) {
    this.setState({
      map,
    });
    this.onMapMoveEnd();
    spiderifier = new MapboxglSpiderifier(this.state.map, {
      onClick: function (e, spiderLeg) {
      },
      markerWidth: 40,
      markerHeight: 40,
    });
  }
  renderEventLayers() {
    this.createMapImages(this.props.mapEventFeatureCollection);
    return <EventsLayer events={this.props.mapEventFeatureCollection} onEventClick={(e) => console.log('event', e)} onClusterClick={this.onClusterClick} />
  }
  renderSubjectLayers() {
    this.createMapImages(this.props.mapSubjectFeatureCollection);
    return <SubjectsLayer 
        subjects={this.props.mapSubjectFeatureCollection}
        onSubjectIconClick={this.onMapSubjectClick}
      />;
  }
  render() {
    if (!this.props.maps.length) return null;
    return (
      <MapboxMap
        id='map'
        ref={this.mapRef}
        className='main-map'
        center={this.getMapCenter()}
        // zoom={this.getMapZoom()}
        onMoveEnd={debounce(this.onMapMoveEnd)}
        movingMethod={'easeTo'}
        onClick={this.onMapClick}
        onStyleLoad={this.setMap}
        {...this.state.mapConfig}>

        <Source
          id='terrain_source'
          tileJsonSource={{
            type: 'vector',
            url: 'mapbox://mapbox.mapbox-terrain-v2'
          }}
        />

        {this.state.map && (
          <Fragment>
            {this.renderTrackLayers()}
            {this.renderEventLayers()}
            {this.renderSubjectLayers()}
            <RotationControl position='top-left' />
            <ZoomControl position='bottom-right' />
            {/* <DrawControl map={this.state.map} position='bottom-left' /> */}
          </Fragment>
        )}

        {/* <Layer
          type='fill-extrusion'
          sourceLayer='contour'
          id='terrain_layer'
          sourceId='terrain_source'
          paint={{
            'fill-extrusion-color': [
              'interpolate',
              ['linear'],
              ['get', 'ele'],
              1000,
              '#FFF',
              1500,
              '#CCC',
              2000,
              '#AAA',
            ],
            'fill-extrusion-opacity': 1,
            'fill-extrusion-height': ["/", ['get', 'ele'], 1],
          }}
        /> */}
      </MapboxMap>
    )
  }
}

const mapStatetoProps = ({ data, view: { homeMap } }) => {
  const { mapSubjects, mapEvents, maps, tracks } = data;
  return { maps, mapSubjects, mapEvents, tracks, homeMap, mapEventFeatureCollection: getMapEventFeatureCollection(data), mapSubjectFeatureCollection: getMapSubjectFeatureCollection(data) };
};

export default connect(mapStatetoProps, { fetchMapSubjects, fetchMapEvents, fetchTracks })(Map);