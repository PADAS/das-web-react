import React from 'react';
import { getTrackPointsFromTrackFeatureArray } from '../selectors';
import { Feature, Layer } from 'react-mapbox-gl';

const layerPaint = {
  
  // Increase the heatmap color weight weight by zoom level
  // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
  // Begin color ramp at 0-stop with a 0-transparancy color
  // to create a blur-like effect.

};

export default function HeatLayer(props) {
  const { trackCollection } = props;
  const tracksAsPoints = getTrackPointsFromTrackFeatureArray(trackCollection).reduce((accumulator, trackPointFeatureCollection) => {
    return [...accumulator, ...trackPointFeatureCollection.features];
  }, []);
  return (
    <Layer before="subject_symbols-symbol" type="heatmap" paint={layerPaint}>
      {tracksAsPoints.map((point, index) => {
        return <Feature key={index} coordinates={point.geometry.coordinates} properties={point.properties} />
      })}
    </Layer>
  );
}