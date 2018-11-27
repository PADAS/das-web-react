import React, { Component } from 'react';
import { connect } from 'react-redux';
import { REACT_APP_MAPBOX_TOKEN } from '../constants';
import 'mapbox-gl/dist/mapbox-gl.css';
import ReactMapboxGl, { ZoomControl/* , Layer */ } from 'react-mapbox-gl';



const MapboxMap = ReactMapboxGl({
  accessToken: REACT_APP_MAPBOX_TOKEN,
  minZoom: 4,
  maxZoom: 19,
});

class Map extends Component {
  state = {
    mapConfig: {
      style: 'mapbox://styles/vjoelm/ciobuir0n0061bdnj1c54oakh',
      zoom: [12],
    },
  };
  getMapCenter() {
    if (this.props.homeMap) return this.props.homeMap.center;
    return this.props.maps.find(map => map.default).center;
  }
  renderEventMarkers() {

  }
  renderSubjectMarkers() {

  }
  renderFeatureLayers() {
    
  }
  render() {
    return (
      this.props.maps.length && <MapboxMap
        id="map"
        className="nice-map"
        center={this.getMapCenter()}
        {...this.state.mapConfig}>
        <ZoomControl position="bottom-right" />
      </MapboxMap>
    )
  }
}

const mapStatetoProps = ({ data: { maps }, view: { homeMap } }) => ({ maps, homeMap });

export default connect(mapStatetoProps, null)(Map);