import React, { memo, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Layer, Source } from 'react-mapbox-gl';
import centroid from '@turf/centroid';

import { LAYER_IDS, MAX_ZOOM } from '../constants';

import { metersToPixelsAtMaxZoom } from '../utils/map';

const { HEATMAP_LAYER, SUBJECT_SYMBOLS } = LAYER_IDS;

const HeatLayer = ({ heatmapStyles, points }) => {
  if (!points.features.length) return null;

  const { geometry: { coordinates: [, latitude] } } = centroid(points);

  const sourceData = {
    type: 'geojson',
    data: points,
  };

  const paint = {
    'heatmap-radius': {
      'stops': [
        [0, 1],
        [MAX_ZOOM, metersToPixelsAtMaxZoom(heatmapStyles.radiusInMeters, latitude)],
      ],
      'base': 2,
    },
    'heatmap-weight': heatmapStyles.intensity,
  };

  return <Fragment>
    <Source id='heatmap-source' geoJsonSource={sourceData} />;
    <Layer sourceId='heatmap-source'  paint={paint} before={SUBJECT_SYMBOLS} id={HEATMAP_LAYER} type="heatmap" />
  </Fragment>;
};

const mapStateToProps = (state) => ({ heatmapStyles: state.view.heatmapStyles });

export default connect(mapStateToProps, null)(memo(HeatLayer), 100);

HeatLayer.propTypes = {
  points: PropTypes.shape({
    features: PropTypes.array.isRequired,
  }).isRequired,
};
