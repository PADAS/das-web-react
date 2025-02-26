import { memo, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';

import { LAYER_IDS, MAP_ICON_SCALE } from '../constants';
import { MapContext } from '../App';
import {
  useMapEventBinding,
  useMapLayer,
  useMapSource,
  useMapSourceBatch,
  useMapLayerBatch
} from '../hooks';

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

  const trackId = id || (trackData.track?.features?.[0]?.properties?.id || 'unknown-track');

  const onSymbolMouseEnter = () => map.getCanvas().style.cursor = 'pointer';
  const onSymbolMouseLeave = () => map.getCanvas().style.cursor = '';

  const sourceId = `track-source-${trackId}`;
  const pointSourceId = `${sourceId}-points`;

  const layerId = `${TRACKS_LINES}-${trackId}`;
  const pointLayerId = `${TRACKS_LINES}-points-${trackId}`;

  // Always add the main sources
  useMapSource(sourceId, trackData.time_of_day_segments || trackData.track, { tolerance: 1.5, type: 'geojson', lineMetrics: true });
  useMapSource(pointSourceId, trackData.points);

  let trackLayerPaintStyles = { ...TRACK_LAYER_LINE_PAINT, ...linePaint };

  // Prepare color pair data
  const { sourcesConfigs, layersConfigs } = useMemo(() => {
    if (!trackData?.time_of_day_segments?.features?.length) {
      return { sourcesConfigs: [], layersConfigs: [] };
    }

    // Group segments by color combinations
    const segmentsByColorPair = {};
    let segmentsWithMissingColors = 0;

    // Group segments with the same start/end color
    trackData.time_of_day_segments.features.forEach((segment, idx) => {
      // Skip segments without required color properties
      if (!segment.properties?.startColor || !segment.properties?.endColor) {
        segmentsWithMissingColors++;
        if (idx < 5) {
          console.warn(`Segment ${idx} missing color properties:`, segment.properties);
        }
        return;
      }

      const key = `${segment.properties.startColor}|${segment.properties.endColor}`;
      if (!segmentsByColorPair[key]) {
        segmentsByColorPair[key] = [];
      }
      segmentsByColorPair[key].push(segment);
    });

    console.log('Segments with missing colors:', segmentsWithMissingColors);
    console.log('Number of unique color pairs:', Object.keys(segmentsByColorPair).length);

    const sources = [];
    const layers = [];

    Object.entries(segmentsByColorPair).forEach(([colorPairKey, segments], index) => {
      const [startColor, endColor] = colorPairKey.split('|');
      const pairSourceId = `${sourceId}-colorpair-${index}`;
      const pairLayerId = `${layerId}-colorpair-${index}`;

      // Add source config
      sources.push({
        id: pairSourceId,
        data: {
          type: 'FeatureCollection',
          features: segments
        },
        options: {
          tolerance: 1.5,
          type: 'geojson',
          lineMetrics: true
        }
      });

      // Add layer config
      layers.push({
        id: pairLayerId,
        type: 'line',
        sourceId: pairSourceId,
        paint: {
          ...TRACK_LAYER_LINE_PAINT,
          'line-width': 2,
          'line-gap-width': 1,
          'line-gradient': [
            'interpolate',
            ['linear'],
            ['line-progress'],
            0, startColor,
            1, endColor
          ]
        },
        layout: { ...TRACK_LAYER_LINE_LAYOUT, ...lineLayout },
        options: {
          before: before || SUBJECT_SYMBOLS
        }
      });
    });

    console.log('Sources created:', sources.length, 'Layers created:', layers.length);

    return {
      sourcesConfigs: sources,
      layersConfigs: layers,
    };

  }, [trackData, sourceId, layerId, trackLayerPaintStyles, lineLayout, before]);

  useMapLayer(
    layerId,
    'line',
    sourceId,
    trackLayerPaintStyles,
    { ...TRACK_LAYER_LINE_LAYOUT, ...lineLayout },
    { before: before || SUBJECT_SYMBOLS }
  );

  useMapSourceBatch(sourcesConfigs, { tolerance: 1.5, type: 'geojson', lineMetrics: true });

  useMapLayerBatch(layersConfigs, { before: before || SUBJECT_SYMBOLS, condition: !!trackData.time_of_day_segments, before: layerId });


  // The timepoint layer is always created
  useMapLayer(
    pointLayerId,
    'symbol',
    pointSourceId,
    TIMEPOINT_LAYER_PAINT,
    TIMEPOINT_LAYER_LAYOUT,
    { before: before || SUBJECT_SYMBOLS, condition: showTimepoints }
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
