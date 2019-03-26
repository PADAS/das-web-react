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
  async componentDidMount() {
    if (!this.props.map.hasImage(ARROW_IMG_ID)) {
      const arrow = await svgSrcToPngImg(Arrow);
      this.props.map.addImage(ARROW_IMG_ID, arrow);
    }
  }
  render() {
    const { trackCollection, onPointClick, map, ...rest } = this.props;
    console.log('trackCollection', trackCollection);
    const tracksAsPoints = trackCollection
      .map(({ tracks }) => explode(tracks))
      .map((feature) => {
        feature.features = feature.features.map((item, index, collection) => {
          const measuredBearing = !!collection[index - 1] ? bearing(item.geometry, collection[index - 1].geometry) : 0;
          const coordinateTime = item.properties.coordinateProperties.times[index];
          return { geometry: item.geometry, properties: { ...item.properties, bearing: measuredBearing, time: coordinateTime }};
        })
        .filter(({ properties: { bearing } }) => !!bearing);
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
            // circleOnMouseEnter={() => map.getCanvas().style.cursor = 'pointer'}
            // circleOnClick={e => console.log('tp click', getPointLayer(e, map))}
            // circleOnMouseLeave={() => map.getCanvas().style.cursor = ''}
            // circlePaint={{
            //   "circle-color": tracks.features[0].properties.stroke || 'orange',
            //   "circle-radius": ["step", ["zoom"], 0, 10, 3, 14, 4],
            // }}
            // symbolLayout={{
            //   'icon-allow-overlap': ["step", ["zoom"], false, 10, true],
            //   'icon-anchor': 'center',
            //   'icon-image': 'track_arrow',
            // }}
            lineLayout={{
              'line-join': 'round',
              'line-cap': 'round',
            }}
          />
        )}
        {

        }
        {tracksAsPoints.map((feature, index) => <GeoJSONLayer key={`track-timepoints-${index}`} id={`track-layer-timepoint-${index}`} data={feature} {...rest}
          symbolOnMouseEnter={() => map.getCanvas().style.cursor = 'pointer'}
          symbolOnClick={e => console.log('tp click', getPointLayer(e, map))}
          symbolOnMouseLeave={() => map.getCanvas().style.cursor = ''}
          symbolLayout={{
            'icon-allow-overlap': true,
            'icon-anchor': 'center',
            'icon-size': ['step', ['zoom'], .2, 12, .35, 15, .5],
            'icon-rotate': ['get', 'bearing'],
            'icon-image': 'track_arrow',
          }}
        />
        )}
      </Fragment>
    );
  }
}

TracksLayer.defaultProps = {
  onPointClick(e) {
    console.log('timepoint click');
  },
};

TracksLayer.propTypes = {
  map: PropTypes.object.isRequired,
  onPointClick: PropTypes.func,
  trackCollection: PropTypes.array.isRequired,
}