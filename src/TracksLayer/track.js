import { memo, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';

import { LAYER_IDS, MAP_ICON_SCALE } from '../constants';
import { MapContext } from '../App';
import {
  useMapEventBinding
} from '../hooks';
import { getTimeOfDaySourceAndLayerConfigurations } from './utils';
import { useSelector } from 'react-redux';
import { selectTrackSettings } from '../selectors/tracks';
import useMapSource from '../hooks/useMapSource';
import useMapLayer from '../hooks/useMapLayer';

const { TRACKS_LINES, SUBJECT_SYMBOLS } = LAYER_IDS;

const TRACK_LAYER_LINE_PAINT = {
  'line-color': [
    'case',
    ['has', 'stroke'], ['get', 'stroke'],
    'orange',
  ],
  'line-width': ['step', ['zoom'], 1, 8, ['get', 'stroke-width']],
};

const TRACK_LAYER_LINE_LAYOUT = {
  'line-join': 'round',
  'line-cap': 'round',
};

const TIMEPOINT_LAYER_LAYOUT = {
  'icon-allow-overlap': ['step', ['zoom'], false, 15, true],
  'icon-anchor': 'bottom',
  'icon-size': ['step', ['zoom'], 0, 11, 0.3 / MAP_ICON_SCALE, 15, 0.5 / MAP_ICON_SCALE],
  'icon-rotate': ['get', 'bearing'],
  'icon-image': 'track_arrow',
  'icon-pitch-alignment': 'map',
  'icon-rotation-alignment': 'map',
};

const TIMEPOINT_LAYER_PAINT = {
  'icon-opacity': [
    'case',
    ['==', ['get', 'index'], 0], 0,
    1,
  ],
};

const TrackLayer = ({ before, id, lineLayout, linePaint, onPointClick, showTimepoints, trackData }) => {
  const map = useContext(MapContext);
  const { isTimeOfDayColoringActive } = useSelector(selectTrackSettings);

  const trackId = id || 'unknown-track';

  const onSymbolMouseEnter = () => map.getCanvas().style.cursor = 'pointer';
  const onSymbolMouseLeave = () => map.getCanvas().style.cursor = '';

  const sourceId = `track-source-${trackId}`;
  const pointSourceId = `${sourceId}-points`;

  const layerId = `${TRACKS_LINES}-${trackId}`;
  const pointLayerId = `${TRACKS_LINES}-points-${trackId}`;

  const {
    sourcesConfigs,
    layersConfigs
  } = useMemo(() => getTimeOfDaySourceAndLayerConfigurations(
    trackData,
    isTimeOfDayColoringActive,
    sourceId,
    layerId,
    { ...TRACK_LAYER_LINE_LAYOUT, ...lineLayout },
    {
      before: before || SUBJECT_SYMBOLS
    }
  ), [trackData, sourceId, layerId, lineLayout, before, isTimeOfDayColoringActive]);


  useMapSource({ id: sourceId, data: trackData.track }, { tolerance: 1.5, type: 'geojson', lineMetrics: true });
  useMapSource({ id: pointSourceId, data: trackData.points });

  useMapSource(sourcesConfigs, { tolerance: 1.5, type: 'geojson', lineMetrics: true });
  useMapLayer(layersConfigs, { before: before || SUBJECT_SYMBOLS });

  // Only create the normal layer if there are no time_of_day_segments
  useMapLayer(
    {
      id: layerId,
      type: 'line',
      sourceId,
      paint: { ...TRACK_LAYER_LINE_PAINT, ...linePaint },
      layout: { ...TRACK_LAYER_LINE_LAYOUT, ...lineLayout },
      options: {
        before: before || SUBJECT_SYMBOLS,
        condition: !isTimeOfDayColoringActive && sourcesConfigs.length === 0
      }
    }
  );

  useMapLayer(
    {
      id: pointLayerId,
      type: 'symbol',
      sourceId: pointSourceId,
      paint: TIMEPOINT_LAYER_PAINT,
      layout: TIMEPOINT_LAYER_LAYOUT,
      options: {
        before: before || SUBJECT_SYMBOLS,
        condition: showTimepoints
      }
    }
  );

  useMapEventBinding('click', onPointClick, pointLayerId, showTimepoints);
  useMapEventBinding('mouseenter', onSymbolMouseEnter, pointLayerId, showTimepoints);
  useMapEventBinding('mouseleave', onSymbolMouseLeave, pointLayerId, showTimepoints);

  return null;
};

TrackLayer.defaultProps = {
  before: null,
  id: null,
  lineLayout: {},
  linePaint: {},
  showTimepoints: true,
};

TrackLayer.propTypes = {
  before: PropTypes.string,
  id: PropTypes.string,
  lineLayout: PropTypes.object,
  linePaint: PropTypes.object,
  onPointClick: PropTypes.func.isRequired,
  showTimepoints: PropTypes.bool,
  trackData: PropTypes.shape({
    points: PropTypes.object,
    track: PropTypes.object,
  }).isRequired,
};

export default memo(TrackLayer);
