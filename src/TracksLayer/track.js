import { memo, useContext, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { addMapImage, safeRemoveMapLayer, safeRemoveMapSource } from '../utils/map';
import { LAYER_IDS, MAP_ICON_SCALE } from '../constants';
import { MapContext } from '../MapContext';
import { segmentTrackPointsByTimeOfDayPeriodPairs } from './utils';
import { useMapEventBinding, useMemoCompare } from '../hooks';

import Arrow from '../common/images/icons/track-arrow.svg?url';

const { SUBJECT_SYMBOLS, TRACKS_LINES, TRACKS_SOURCE, TRACK_TIMEPOINTS } = LAYER_IDS;

export const ARROW_IMG_ID = 'track_arrow';

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
  'line-width': ['step', ['zoom'], 3, 8, ['*', ['get', 'stroke-width'], 1.75]],
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

// A gradient reads the line's own progress, which the map only measures where
// the source asks for it.
const LINE_SOURCE_OPTIONS = { lineMetrics: true, tolerance: 1.5, type: 'geojson' };

const EMPTY_FEATURE_COLLECTION = { features: [], type: 'FeatureCollection' };

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

  const isTimeOfDayColoringActive = useSelector(
    (state) => state.view.trackSettings.isTimeOfDayColoringActive
  );

  const trackId = id;

  const sourceId = `${TRACKS_SOURCE}-${trackId}`;
  const pointSourceId = `${sourceId}-points`;

  const layerId = `${TRACKS_LINES}-${trackId}`;
  const pointLayerId = `${TRACK_TIMEPOINTS}-${trackId}`;

  const lineBeforeId = before || SUBJECT_SYMBOLS;
  const timepointBeforeId = before || `${SUBJECT_SYMBOLS}-unclustered`;

  // The callers build these fresh on every render, so a compared copy is what
  // keeps the layers off a teardown-and-rebuild cycle.
  const stableLineLayout = useMemoCompare({ ...TRACK_LAYER_LINE_LAYOUT, ...lineLayout });
  const stableLinePaint = useMemoCompare({ ...TRACK_LAYER_LINE_PAINT, ...linePaint });

  // One source and one line per pair of time-of-day periods the track crosses,
  // each drawing the gradient between that pair's two colours.
  const timeOfDayColorPairs = useMemo(() => {
    if (!isTimeOfDayColoringActive || !trackData.trackSegments?.features?.length) {
      return [];
    }

    return Object.entries(segmentTrackPointsByTimeOfDayPeriodPairs(trackData.trackSegments))
      .map(([colorPairKey, segments], index) => ({
        colors: colorPairKey.split('|'),
        layerId: `${layerId}-colorpair-${index}`,
        segments,
        sourceId: `${sourceId}-colorpair-${index}`,
      }));
  }, [isTimeOfDayColoringActive, layerId, sourceId, trackData.trackSegments]);

  // What the lines are, without what they draw: new positions reach a line
  // through its source rather than by building it again.
  const timeOfDayLines = useMemoCompare(timeOfDayColorPairs.map(
    (timeOfDayColorPair) => ({
      colors: timeOfDayColorPair.colors,
      layerId: timeOfDayColorPair.layerId,
      sourceId: timeOfDayColorPair.sourceId,
    })
  ));

  const onSymbolMouseEnter = () => map.getCanvas().style.cursor = 'pointer';
  const onSymbolMouseLeave = () => map.getCanvas().style.cursor = '';

  // Registered here rather than by whatever draws the tracks, so a patrol
  // track has its arrows even when no subject track is on the map.
  useEffect(() => {
    if (!map.hasImage(ARROW_IMG_ID)) {
      addMapImage({ id: ARROW_IMG_ID, src: Arrow });
    }
  }, [map]);

  useEffect(() => {
    if (!map || timeOfDayLines.length > 0) {
      return undefined;
    }

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, { ...LINE_SOURCE_OPTIONS, data: EMPTY_FEATURE_COLLECTION });
    }

    if (!map.getLayer(layerId)) {
      map.addLayer(
        {
          id: layerId,
          layout: stableLineLayout,
          paint: stableLinePaint,
          source: sourceId,
          type: 'line',
        },
        map.getLayer(lineBeforeId) ? lineBeforeId : undefined
      );
    }

    return () => {
      safeRemoveMapLayer(map, layerId);
      safeRemoveMapSource(map, sourceId);
    };
  }, [layerId, lineBeforeId, map, sourceId, stableLineLayout, stableLinePaint, timeOfDayLines.length]);

  useEffect(() => {
    if (!map || !showTimepoints) {
      return undefined;
    }

    if (!map.getSource(pointSourceId)) {
      map.addSource(pointSourceId, { data: EMPTY_FEATURE_COLLECTION, type: 'geojson' });
    }

    if (!map.getLayer(pointLayerId)) {
      map.addLayer(
        {
          id: pointLayerId,
          layout: TIMEPOINT_LAYER_LAYOUT,
          paint: TIMEPOINT_LAYER_PAINT,
          source: pointSourceId,
          type: 'symbol',
        },
        map.getLayer(timepointBeforeId) ? timepointBeforeId : undefined
      );
    }

    return () => {
      safeRemoveMapLayer(map, pointLayerId);
      safeRemoveMapSource(map, pointSourceId);
    };
  }, [map, pointLayerId, pointSourceId, showTimepoints, timepointBeforeId]);

  useEffect(() => {
    if (!map || timeOfDayLines.length === 0) {
      return undefined;
    }

    timeOfDayLines.forEach((timeOfDayLine) => {
      if (!map.getSource(timeOfDayLine.sourceId)) {
        map.addSource(timeOfDayLine.sourceId, { ...LINE_SOURCE_OPTIONS, data: EMPTY_FEATURE_COLLECTION });
      }

      if (!map.getLayer(timeOfDayLine.layerId)) {
        map.addLayer(
          {
            id: timeOfDayLine.layerId,
            layout: stableLineLayout,
            paint: {
              'line-gradient': [
                'interpolate',
                ['linear'],
                ['line-progress'],
                0, timeOfDayLine.colors[0],
                1, timeOfDayLine.colors[1],
              ],
              'line-width': 3,
            },
            source: timeOfDayLine.sourceId,
            type: 'line',
          },
          map.getLayer(lineBeforeId) ? lineBeforeId : undefined
        );
      }
    });

    return () => {
      timeOfDayLines.forEach((timeOfDayLine) => {
        safeRemoveMapLayer(map, timeOfDayLine.layerId);
        safeRemoveMapSource(map, timeOfDayLine.sourceId);
      });
    };
  }, [lineBeforeId, map, stableLineLayout, timeOfDayLines]);

  useEffect(() => {
    if (map) {
      map.getSource(sourceId)?.setData?.(trackData.track ?? EMPTY_FEATURE_COLLECTION);
      map.getSource(pointSourceId)?.setData?.(trackData.points ?? EMPTY_FEATURE_COLLECTION);
    }
  }, [map, pointSourceId, sourceId, trackData]);

  useEffect(() => {
    if (map) {
      timeOfDayColorPairs.forEach((timeOfDayColorPair) => {
        map.getSource(timeOfDayColorPair.sourceId)
          ?.setData?.({ features: timeOfDayColorPair.segments, type: 'FeatureCollection' });
      });
    }
  }, [map, timeOfDayColorPairs]);

  useMapEventBinding('click', onPointClick, pointLayerId, showTimepoints);
  useMapEventBinding('mouseenter', onSymbolMouseEnter, pointLayerId, showTimepoints);
  useMapEventBinding('mouseleave', onSymbolMouseLeave, pointLayerId, showTimepoints);

  return null;
};

export default memo(TrackLayer);
