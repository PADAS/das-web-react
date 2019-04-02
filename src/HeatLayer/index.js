import React, { memo } from 'react';
import { connect } from 'react-redux';
import { getTrackPointsFromTrackFeatureArray, removePersistKey } from '../selectors';
import { Feature, Layer } from 'react-mapbox-gl';
import isEqual from 'lodash/isEqual';

const HeatLayer = memo(function HeatLayer({ trackCollection, heatmapStyles }) {
  const tracksAsPoints = getTrackPointsFromTrackFeatureArray(trackCollection).reduce((accumulator, trackPointFeatureCollection) => {
    return [...accumulator, ...trackPointFeatureCollection.features];
  }, []);

  return (
    <Layer before="subject_symbols-symbol" type="heatmap" paint={heatmapStyles}>
      {tracksAsPoints.map((point, index) => {
        return <Feature key={index} coordinates={point.geometry.coordinates} properties={point.properties} />
      })}
    </Layer>
  );
}, (prev, current) => {
  return isEqual(prev.heatmapStyles, current.heatmapStyles) && isEqual(prev.trackCollection, current.trackCollection);
});

const mapStateToProps = ({ view: { heatmapStyles } }) => ({ heatmapStyles: removePersistKey(heatmapStyles) });

export default connect(mapStateToProps, null)(HeatLayer);