import React, { memo } from 'react';
import { connect } from 'react-redux';
import { getHeatmapTrackPoints, removePersistKey } from '../selectors';
import { Feature, Layer } from 'react-mapbox-gl';
import isEqual from 'react-fast-compare';
import debounceRender from 'react-debounce-render';
import { GENERATED_LAYER_IDS, LAYER_IDS } from '../constants';

const { HEATMAP_LAYER } = LAYER_IDS;
const { SUBJECT_SYMBOLS } = GENERATED_LAYER_IDS;

const HeatLayer = memo(({ heatmapStyles, tracksAsPoints }) => {
  const styles = removePersistKey(heatmapStyles);
  return <Layer before={SUBJECT_SYMBOLS} id={HEATMAP_LAYER} type="heatmap">
    {tracksAsPoints.features.map((point, index) => {
      return <Feature key={index} coordinates={point.geometry.coordinates} properties={point.properties} />
    })}
  </Layer>
}, (prev, current) => isEqual(prev.tracksAsPoints, current.tracksAsPoints));

const mapStateToProps = (state) => ({ heatmapStyles: state.view.heatmapStyles, tracksAsPoints: getHeatmapTrackPoints(state) });

export default connect(mapStateToProps, null)(debounceRender(HeatLayer));
