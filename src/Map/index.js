import './Map.css';
import React, { Component, createRef, Fragment } from 'react';
import { connect } from 'react-redux';
import { REACT_APP_MAPBOX_TOKEN } from '../constants';
import { fetchMapSubjects } from '../ducks/subjects';
import { fetchMapEvents } from '../ducks/events';
import { fetchTracks } from '../ducks/tracks';
import { CancelToken } from 'axios';
import { svgSrcToPngImg } from '../utils/img';
import debounce from 'lodash/debounce';
import set from 'lodash/set';
import uniq from 'lodash/uniq';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapboxgl-spiderifier/index.css';
import MapboxglSpiderifier from 'mapboxgl-spiderifier';
import createSocket, { unbindSocketEvents } from '../socket';
import ReactMapboxGl, { ZoomControl, RotationControl, GeoJSONLayer, Marker, Source } from 'react-mapbox-gl';
import DrawControl from 'react-mapbox-gl-draw/lib';
import { getMapEventFeatureCollection, getMapSubjectFeatureCollection } from '../selectors';

let spiderifier;

const MapboxMap = ReactMapboxGl({
  accessToken: REACT_APP_MAPBOX_TOKEN,
  minZoom: 4,
  maxZoom: 18,
});

const MAP_EVENT_CLUSTER_SOURCE_OPTIONS = {
  cluster: true,
  clusterMaxZoom: 20, // Max zoom to cluster points on
  clusterRadius: 40,
};


const MAP_ICON_SIZE = {
  height: 30,
  width: 30,
};

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
        showEvents: true,
        showTimePoints: true,
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

    return trackCollection.map((feature) => {
      return (
        <Fragment key={`${feature.id}-tracks`}>
          {/* {
            this.state.layers.showTimePoints &&
            <GeoJSONLayer
              data={feature.tracks}
              circlePaint={{
                "circle-color": feature.tracks.features[0].properties.stroke || 'orange',
                "circle-radius": 3,
              }} />
          } */}
          <GeoJSONLayer
            data={feature.tracks}
            linePaint={{
              'line-color': feature.tracks.features[0].properties.stroke || 'orange',
              'line-width': feature.tracks.features[0].properties['stroke-width'],
            }}
            circlePaint={{
              "circle-color": feature.tracks.features[0].properties.stroke || 'orange',
              "circle-radius": 3,
            }}
            lineLayout={{
              'line-join': 'round',
              'line-cap': 'round',
            }} />
        </Fragment>
      )
    });
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
  renderEventMarkers() {
    if (!this.props.mapEvents.length) return null;

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
  onMapClick() {
    spiderifier && spiderifier.unspiderfy();
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
  async createMapImages({ features }) {
    if (!this.state.map || !features.length) return;
    const mapImageIDs = this.state.map.listImages();
    let images = features
      .filter(({ properties: { image } }) => !!image)
      .map(({ properties: { image, icon_id } }) => ({ icon_id, image }))
      .filter(({ icon_id }, index, array) => !mapImageIDs.includes(icon_id) && (array.findIndex(item => item.icon_id === icon_id) === index))
      .map(({ image, icon_id }) => svgSrcToPngImg(image, MAP_ICON_SIZE)
        .then((img) => {
          if (!this.state.map.hasImage(icon_id)) this.state.map.addImage(icon_id, img);
        }));

    await Promise.all(images).then(() => {
      if (images.length) {
        debounce(this.forceUpdate, 300);
      }
    });
  }
  onMapSubjectClick(e) {
    const [{ properties }] = this.state.map.queryRenderedFeatures(e.point, { layers: ['subject_symbols-symbol'] });
    const { id, tracks_available } = properties;

    if (!tracks_available) return;

    if (this.state.layers.tracks.visibleIDs.includes(id)) {
      return this.setState(prevState => uniq(set(
        prevState,
        ['layers', 'tracks', 'visibleIDs'],
        this.state.layers.tracks.visibleIDs.filter(val => val !== id),
      )));
    }

    this.props.fetchTracks(id);

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
    return (
      <Fragment>
        <GeoJSONLayer
          id="event_clusters"
          data={this.props.mapEventFeatureCollection}
          circleOnClick={this.onClusterClick}
          sourceOptions={MAP_EVENT_CLUSTER_SOURCE_OPTIONS}
          layerOptions={{
            filter: ['has', 'point_count'],
          }}
          circlePaint={{
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#51bbd6",
              25,
              "#f28cb1"
            ],
            "circle-radius": [
              "case",
              ['<', ['get', 'point_count'], 10], 15,
              ['>', ['get', 'point_count'], 10], 25,
              15,
            ]
          }} />
        <GeoJSONLayer
          id="event_cluster_count"
          data={this.props.mapEventFeatureCollection}
          sourceOptions={MAP_EVENT_CLUSTER_SOURCE_OPTIONS}
          layerOptions={{
            filter: ['has', 'point_count'],
          }}
          symbolLayout={{
            "text-field": "{point_count_abbreviated}",
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 12
          }} />

        <GeoJSONLayer
          id="event_symbols"
          data={this.props.mapEventFeatureCollection}
          sourceOptions={MAP_EVENT_CLUSTER_SOURCE_OPTIONS}
          layerOptions={{
            filter: ['!has', 'point_count'],
          }}
          symbolLayout={{
            'icon-allow-overlap': ["step", ["zoom"], false, 12, true],
            'icon-anchor': 'bottom',
            'icon-image': ["get", "icon_id"],
            'text-allow-overlap': ["step", ["zoom"], false, 12, true],
            'text-anchor': 'top',
            'text-field': '{display_title}',
            'text-justify': 'center',
            'text-size': 12,
          }} />
      </Fragment>
    );
  }
  renderSubjectLayers() {
    this.createMapImages(this.props.mapSubjectFeatureCollection);
    return (
      <GeoJSONLayer
        id="subject_symbols"
        symbolOnClick={this.onMapSubjectClick}
        data={this.props.mapSubjectFeatureCollection}
        symbolLayout={{
          'icon-allow-overlap': ["step", ["zoom"], false, 12, true],
          'icon-anchor': 'bottom',
          'icon-image': ["get", "icon_id"],
          'text-allow-overlap': ["step", ["zoom"], false, 12, true],
          'text-anchor': 'top',
          'text-field': '{name}',
          'text-justify': 'center',
          'text-size': 12,
        }} />
    );
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

        <Source
          id='event_source'
          geoJsonSource={{
            type: 'geojson',
            data: this.props.mapEventFeatureCollection,
          }}
        />
        {(this.state.layers.tracks.visibleIDs.length || this.state.layers.tracks.pinnedIDs.length) && this.renderTrackLayers()}
        {this.renderEventLayers()}
        {this.renderSubjectLayers()}

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

        <RotationControl position='top-left' />
        <ZoomControl position='bottom-right' />
        <DrawControl position='bottom-left' />
      </MapboxMap>
    )
  }
}

const mapStatetoProps = ({ data, view: { homeMap } }) => {
  const { mapSubjects, mapEvents, maps, tracks } = data;
  return { maps, mapSubjects, mapEvents, tracks, homeMap, mapEventFeatureCollection: getMapEventFeatureCollection(data), mapSubjectFeatureCollection: getMapSubjectFeatureCollection(data) };
};

export default connect(mapStatetoProps, { fetchMapSubjects, fetchMapEvents, fetchTracks })(Map);