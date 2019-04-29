import React, { memo } from 'react';
import { connect } from 'react-redux';
import { getHeatmapTrackPoints, removePersistKey } from '../selectors';
import { Feature, Layer } from 'react-mapbox-gl';
import isEqual from 'react-fast-compare';
import debounceRender from 'react-debounce-render';

const HeatLayer = memo(({ tracksAsPoints }) =>
  <Layer before="subject_symbols-symbol" type="heatmap">
    {tracksAsPoints.features.map((point, index) => {
      return <Feature key={index} coordinates={point.geometry.coordinates} properties={point.properties} />
    })}
  </Layer>
, (prev, current) => isEqual(prev.tracksAsPoints, current.tracksAsPoints));

const mapStateToProps = (state) => ({ heatmapStyles: removePersistKey(state.view.heatmapStyles), tracksAsPoints: getHeatmapTrackPoints(state) });

export default connect(mapStateToProps, null)(debounceRender(HeatLayer));
