import React, { memo, useMemo } from 'react';
import PropTypes from 'prop-types';

import { LAYER_IDS, MAP_ICON_SCALE } from '../constants';
import { useMapEventBinding, useMapLayer, useMapSource } from '../hooks';

const { TRACKS_LINES, SUBJECT_SYMBOLS } = LAYER_IDS;
const trackLayerLinePaint = {
  'line-color': [
    'case',
    ['has', 'stroke'], ['get', 'stroke'],
    'orange',
  ],
  'line-width': ['step', ['zoom'], 1, 8, ['get', 'stroke-width']],
};

const trackLayerLineLayout = {
  'line-join': 'round',
  'line-cap': 'round',
};

const timepointLayerLayout = {
  'icon-allow-overlap': ['step', ['zoom'], false, 15, true],
  'icon-anchor': 'bottom',
  'icon-size': ['step', ['zoom'], 0, 11, 0.3/MAP_ICON_SCALE, 15, 0.5/MAP_ICON_SCALE],
  'icon-rotate': ['get', 'bearing'],
  'icon-image': 'track_arrow',
  'icon-pitch-alignment': 'map',
  'icon-rotation-alignment': 'map',
};

const timepointLayerPaint = {
  'icon-opacity': [
    'case',
    ['==', ['get', 'index'], 0], 0,
    1,
  ],
};

const trackSourceConfig = {
  tolerance: 1.5,
  type: 'geojson',
};

const TrackLayer = ({ id, map, onPointClick, linePaint = {}, lineLayout = {}, trackData, showTimepoints, before = null, dispatch: _dispatch }) => {
  const trackLinePaint = useMemo(() => ({
    ...trackLayerLinePaint,
    ...linePaint,
  }), [linePaint]);

  const trackLineLayout = useMemo(() => ({
    ...trackLayerLineLayout,
    ...lineLayout,
  }), [lineLayout]);

  const layerBefore = useMemo(() => before || SUBJECT_SYMBOLS, [before]);

  const { track: trackCollection, points: trackPointCollection } = trackData;
  const trackId = id || trackCollection.features[0].properties.id;

  const onSymbolMouseEnter = () => map.getCanvas().style.cursor = 'pointer';
  const onSymbolMouseLeave = () => map.getCanvas().style.cursor = '';

  const sourceId = `track-source-${trackId}`;
  const pointSourceId = `${sourceId}-points`;

  const layerId = `${TRACKS_LINES}-${trackId}`;
  const pointLayerId = `${TRACKS_LINES}-points-${trackId}`;

  useMapSource(sourceId, trackCollection, trackSourceConfig);
  useMapSource(pointSourceId, trackPointCollection);

  useMapLayer(layerId, 'line', sourceId, trackLinePaint, trackLineLayout, { before: layerBefore });
  useMapLayer(pointLayerId, 'symbol', pointSourceId, timepointLayerPaint, timepointLayerLayout, { before: layerBefore, condition: showTimepoints });

  useMapEventBinding('click', onPointClick, pointLayerId, showTimepoints);
  useMapEventBinding('mouseenter', onSymbolMouseEnter, pointLayerId, showTimepoints);
  useMapEventBinding('mouseleave', onSymbolMouseLeave, pointLayerId, showTimepoints);

  return null;
  /* return <Fragment>

    <Layer sourceId={sourceId} type='line' before={layerBefore}
      paint={trackLinePaint} layout={trackLineLayout} id={layerId} {...rest} />

    {showTimepoints && <DebouncedLayer sourceId={pointSourceId} type='symbol' before={layerBefore}
      onMouseEnter={onSymbolMouseEnter}
      onMouseLeave={onSymbolMouseLeave}
      onClick={onPointClick} layout={timepointLayerLayout} paint={timepointLayerPaint} id={pointLayerId} {...rest} />}

  </Fragment>; */
};

export default memo(TrackLayer);

TrackLayer.defaultProps = {
  onPointClick() {
  },
  showTimepoints: true,
};

TrackLayer.propTypes = {
  map: PropTypes.object.isRequired,
  onPointClick: PropTypes.func,
  showTimepoints: PropTypes.bool,
  trackCollection: PropTypes.object,
  trackPointCollection: PropTypes.object,
};