import React, { memo, useMemo, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Source, Layer } from 'react-mapbox-gl';
import debounceRender from 'react-debounce-render';

import { LAYER_IDS, MAP_ICON_SCALE } from '../constants';

const { TRACKS_LINES, SUBJECT_SYMBOLS } = LAYER_IDS;

const DebouncedLayer = debounceRender(Layer, 200);
const DebouncedSource = debounceRender(Source, 200);

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
  'icon-opacity':[
    'case',
    ['==', ['get', 'index'], 0], 0,
    1,
  ],
};

const TrackLayer = (props) => {
  const { id, map, onPointClick, linePaint = {}, lineLayout = {}, trackData, showTimepoints, before = null, dispatch:_dispatch, ...rest } = props;

  const trackLinePaint = useMemo(() => ({
    ...trackLayerLinePaint,
    ...linePaint,
  }), [linePaint]);

  const trackLineLayout = useMemo(() => ({
    ...trackLayerLineLayout,
    ...lineLayout,
  }), [lineLayout]);

  const layerBefore = useMemo(() => before || SUBJECT_SYMBOLS, [before]);


  const { track:trackCollection, points:trackPointCollection } = trackData;
  const trackId = id || trackCollection.features[0].properties.id;
  
  const onSymbolMouseEnter = () => map.getCanvas().style.cursor = 'pointer';
  const onSymbolMouseLeave = () => map.getCanvas().style.cursor = '';

  const trackSourceConfig = useMemo(() => ({
    tolerance: 1.5,
    type: 'geojson',
    data: trackCollection,
  }), [trackCollection]);

  const trackPointSourceConfig = useMemo(() => ({
    type: 'geojson',
    data: trackPointCollection,
  }), [trackPointCollection]);
  
  if (!trackData.track) return null;

  const sourceId = `track-source-${trackId}`;
  const pointSourceId = `${sourceId}-points`;

  const layerId = `${TRACKS_LINES}-${trackId}`;
  const pointLayerId = `${TRACKS_LINES}-points-${trackId}`;

  return <Fragment>
    <Source id={sourceId} geoJsonSource={trackSourceConfig} />
    <DebouncedSource id={pointSourceId} geoJsonSource={trackPointSourceConfig} />

    <Layer sourceId={sourceId} type='line' before={layerBefore}
      paint={trackLinePaint} layout={trackLineLayout} id={layerId} {...rest} />

    {showTimepoints && <DebouncedLayer sourceId={pointSourceId} type='symbol' before={layerBefore}
      onMouseEnter={onSymbolMouseEnter}
      onMouseLeave={onSymbolMouseLeave}
      onClick={onPointClick} layout={timepointLayerLayout} paint={timepointLayerPaint} id={pointLayerId} {...rest} />}

  </Fragment>;
};

export default memo(TrackLayer);

TrackLayer.defaultProps = {
  onPointClick(layer) {
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