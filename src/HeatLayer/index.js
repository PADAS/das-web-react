import React, { memo } from 'react';
import { connect } from 'react-redux';
import { Feature, Layer } from 'react-mapbox-gl';
import centroid from '@turf/centroid';

import { GENERATED_LAYER_IDS, LAYER_IDS, MAX_ZOOM } from '../constants';

import { getHeatmapTrackPoints } from '../selectors';
import { metersToPixelsAtMaxZoom } from '../utils/map';

const { HEATMAP_LAYER } = LAYER_IDS;
const { SUBJECT_SYMBOLS } = GENERATED_LAYER_IDS;

const HeatLayer = ({ heatmapStyles, tracksAsPoints }) => {
  if (!tracksAsPoints.features.length) return null;

  const { geometry: { coordinates: [, latitude] } } = centroid(tracksAsPoints);

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

  return <Layer paint={paint} before={SUBJECT_SYMBOLS} id={HEATMAP_LAYER} type="heatmap">
    {tracksAsPoints.features.map((point, index) => {
      return <Feature key={index} coordinates={point.geometry.coordinates} properties={point.properties} />;
    })}
  </Layer>;
};

const mapStateToProps = (state) => ({ heatmapStyles: state.view.heatmapStyles, tracksAsPoints: getHeatmapTrackPoints(state) });

export default connect(mapStateToProps, null)(memo(HeatLayer));
