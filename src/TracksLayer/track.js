import { memo, useContext, useMemo } from 'react';

import { LAYER_IDS, MAP_ICON_SCALE } from '../constants';
import { MapContext } from '../App';
import {
  useMapEventBinding
} from '../hooks';
import { getTimeOfDaySourceAndLayerConfigurations } from './utils';
import { useSelector } from 'react-redux';
import { selectTrackSettings } from '../selectors/tracks';
import useMapSources from '../hooks/useMapSources';
import useMapLayers from '../hooks/useMapLayers';

const { TRACKS_LINES, SUBJECT_SYMBOLS } = LAYER_IDS;

const STABLE_RANDOM_TRACK_COLOR_BASED_ON_ID = [
  'rgb',
  ['random', 64, 224, ['concat', ['get', 'id'], '-r']],
  ['random', 64, 224, ['concat', ['get', 'id'], '-g']],
  ['random', 64, 224, ['concat', ['get', 'id'], '-b']]
];

const TRACK_LAYER_LINE_PAINT = {
  'line-color': [
    'case',
    ['all',
      ['has', 'stroke'],
      ['!=', ['get', 'stroke'], '']
    ], ['to-color', ['get', 'stroke']],
    STABLE_RANDOM_TRACK_COLOR_BASED_ON_ID,
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

const TrackLayer = ({
  before = null,
  id = null,
  lineLayout = {},
  linePaint = {},
  onPointClick,
  showTimepoints = true,
  trackData,
}) => {
  const map = useContext(MapContext);
  const { isTimeOfDayColoringActive } = useSelector(selectTrackSettings);

  const trackId = id;

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


  useMapSources([{ id: sourceId, data: trackData.track }], { tolerance: 1.5, type: 'geojson', lineMetrics: true });
  useMapSources([{ id: pointSourceId, data: trackData.points }]);

  useMapSources(sourcesConfigs, { tolerance: 1.5, type: 'geojson', lineMetrics: true });
  useMapLayers(layersConfigs);

  // Only create the normal layer if there are no time_of_day_segments
  useMapLayers([{
    id: layerId,
    type: 'line',
    sourceId,
    paint: { ...TRACK_LAYER_LINE_PAINT, ...linePaint },
    layout: { ...TRACK_LAYER_LINE_LAYOUT, ...lineLayout },
    options: {
      before: before || SUBJECT_SYMBOLS,
      condition: !isTimeOfDayColoringActive && sourcesConfigs.length === 0
    }
  }]);

  useMapLayers([{
    id: pointLayerId,
    type: 'symbol',
    sourceId: pointSourceId,
    paint: TIMEPOINT_LAYER_PAINT,
    layout: TIMEPOINT_LAYER_LAYOUT,
    options: {
      before: before || SUBJECT_SYMBOLS,
      condition: showTimepoints
    }
  }]);

  useMapEventBinding('click', onPointClick, pointLayerId, showTimepoints);
  useMapEventBinding('mouseenter', onSymbolMouseEnter, pointLayerId, showTimepoints);
  useMapEventBinding('mouseleave', onSymbolMouseLeave, pointLayerId, showTimepoints);

  return null;
};

export default memo(TrackLayer);
