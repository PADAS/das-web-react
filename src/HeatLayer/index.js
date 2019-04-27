import React, { memo } from 'react';
import { connect } from 'react-redux';
import { getTrackPointsFromTrackFeatureArray, removePersistKey } from '../selectors';
import { Feature, Layer } from 'react-mapbox-gl';
import isEqual from 'react-fast-compare';

const HeatLayer = memo(({ tracksAsPoints, heatmapStyles }) =>
  <Layer before="subject_symbols-symbol" type="heatmap">
    {tracksAsPoints.features.map((point, index) => {
      return <Feature key={index} coordinates={point.geometry.coordinates} properties={point.properties} />
    })}
  </Layer>
);

const mapStateToProps = ({ view: { heatmapStyles } }, { trackCollection }) => ({ heatmapStyles: removePersistKey(heatmapStyles), tracksAsPoints: getTrackPointsFromTrackFeatureArray(trackCollection) });

HeatLayer.whyDidYouRender = true;
export default connect(mapStateToProps, null)(HeatLayer);
