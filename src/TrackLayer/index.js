import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { GeoJSONLayer } from 'react-mapbox-gl';

export default class TrackLayer extends Component {
  render() {
    const { tracks, map, id, ...rest } = this.props;
    return <GeoJSONLayer before="subject_symbols-symbol" id={`track-layer-${id}`} data={tracks} {...rest}
      linePaint={{
        'line-color': tracks.features[0].properties.stroke || 'orange',
        'line-width': ["step", ["zoom"], 0, 8, tracks.features[0].properties['stroke-width']],
      }}
      circleOnMouseEnter={() => map.getCanvas().style.cursor = 'pointer'}
      circleOnMouseLeave={() => map.getCanvas().style.cursor = ''}
      circlePaint={{
        "circle-color": tracks.features[0].properties.stroke || 'orange',
        "circle-radius": ["step", ["zoom"], 0, 10, 3, 14, 4],
      }}
      lineLayout={{
        'line-join': 'round',
        'line-cap': 'round',
      }}
    />;
  }
}

TrackLayer.propTypes = {
  map: PropTypes.object.isRequired,
  tracks: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
}