import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { GeoJSONLayer } from 'react-mapbox-gl';

import explode from '@turf/explode';
import bearing from '@turf/bearing';

import { svgSrcToPngImg } from '../utils/img';
import Arrow from '../common/images/icons/track-arrow.svg';

const ARROW_IMG_ID = 'track_arrow';
const getPointLayer = (e, map) => map.queryRenderedFeatures(e.point).filter(item => item.layer.type === 'symbol')[0];

export default class TracksLayer extends Component {
  constructor (props) {
    super(props);

    this.onTimepointClick = this.onTimepointClick.bind(this);
  }
  async componentDidMount() {
    if (!this.props.map.hasImage(ARROW_IMG_ID)) {
      const arrow = await svgSrcToPngImg(Arrow);
      this.props.map.addImage(ARROW_IMG_ID, arrow);
    }
  }
  onTimepointClick(e) {
    this.props.onPointClick(getPointLayer(e, this.props.map));
  }
  render() {
    const { trackCollection, onPointClick, map, ...rest } = this.props;
    const tracksAsPoints = trackCollection
      .map(({ tracks }) => explode(tracks))
      .map((feature) => {
        feature.features = feature.features.map((item, index, collection) => {
          const measuredBearing = !!collection[index - 1] ? bearing(item.geometry, collection[index - 1].geometry) : 0;
          const coordinateTime = item.properties.coordinateProperties.times[index];
          const returnValue = { geometry: item.geometry, properties: { ...item.properties, bearing: measuredBearing, time: coordinateTime }};
          delete returnValue.properties.coordinateProperties;
          return returnValue;
        }).filter((feature, index) => index !== 0 || !!(index % 2));
        return feature;
      });
    return (
      <Fragment>
        {trackCollection.map(({ id, tracks }) =>
          <GeoJSONLayer key={`track-layer-${id}`} before="subject_symbols-symbol" id={`track-layer-${id}`} data={tracks} {...rest}
            linePaint={{
              'line-color': tracks.features[0].properties.stroke || 'orange',
              'line-width': ["step", ["zoom"], 0, 8, tracks.features[0].properties['stroke-width']],
            }}
            lineLayout={{
              'line-join': 'round',
              'line-cap': 'round',
            }}
          />
        )}
        {

        }
        {tracksAsPoints.map((feature, index) => <GeoJSONLayer before="subject_symbols-symbol" key={`track-timepoints-${index}`} id={`track-layer-timepoint-${index}`} data={feature} {...rest}
          symbolOnMouseEnter={() => map.getCanvas().style.cursor = 'pointer'}
          symbolOnClick={this.onTimepointClick}
          symbolOnMouseLeave={() => map.getCanvas().style.cursor = ''}
          symbolLayout={{
            'icon-allow-overlap': true,
            'icon-anchor': 'bottom',
            'icon-size': ['step', ['zoom'], 0, 14, .3, 16, .5],
            'icon-rotate': ['get', 'bearing'],
            'icon-image': 'track_arrow',
            'icon-pitch-alignment': 'map',
            'icon-rotation-alignment': 'map',
          }}
        />
        )}
      </Fragment>
    );
  }
}

TracksLayer.defaultProps = {
  onPointClick(layer) {
    console.log('clicked timepoint', layer);
  },
};

TracksLayer.propTypes = {
  map: PropTypes.object.isRequired,
  onPointClick: PropTypes.func,
  trackCollection: PropTypes.array.isRequired,
}