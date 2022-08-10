import React, { memo, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import centroid from '@turf/centroid';

import { LAYER_IDS, MAX_ZOOM } from '../constants';

import { metersToPixelsAtMaxZoom } from '../utils/map';
import { uuid } from '../utils/string';
import { useMapLayer, useMapSource } from '../hooks';

const { HEATMAP_LAYER, TOPMOST_STYLE_LAYER } = LAYER_IDS;

const HeatLayer = ({ heatmapStyles, points }) => {
  const idRef = useRef(uuid());


  const { geometry: { coordinates: [, latitude] } } = centroid(points);

  const paint = useMemo(() => ({
    'heatmap-radius': {
      'stops': [
        [0, 1],
        [MAX_ZOOM, metersToPixelsAtMaxZoom(heatmapStyles.radiusInMeters, latitude)],
      ],
      'base': 2,
    },
    'heatmap-weight': heatmapStyles.intensity,
  }), [heatmapStyles.intensity, latitude, heatmapStyles.radiusInMeters]);

  useMapSource(`heatmap-source-${idRef.current}`, points);
  useMapLayer(`${HEATMAP_LAYER}-${idRef.current}`, 'heatmap', `heatmap-source-${idRef.current}`, paint);

  return null;

  /* return <Fragment>
    <Source id={`heatmap-source-${idRef.current}`} geoJsonSource={sourceData} />;
    <Layer sourceId={`heatmap-source-${idRef.current}`}  paint={paint} before={TOPMOST_STYLE_LAYER} id={`${HEATMAP_LAYER}-${idRef.current}`} type='heatmap' />
  </Fragment>; */
};

const mapStateToProps = (state) => ({ heatmapStyles: state.view.heatmapStyles });

export default connect(mapStateToProps, null)(memo(HeatLayer), 100);

HeatLayer.propTypes = {
  points: PropTypes.shape({
    features: PropTypes.array.isRequired,
  }).isRequired,
};
