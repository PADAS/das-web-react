import { memo, useCallback, useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import isEqual from 'react-fast-compare';
import uniq from 'lodash/uniq';

import { MapContext } from '../App';
import { useMapEventBinding } from '../hooks';
import { addMapImage, getTimeOfDayLineColorExpression, safeRemoveMapLayer } from '../utils/map';
import { getTimezoneOffsetMinutes } from '../utils/datetime';
import { API_URL, MAP_ICON_SCALE } from '../constants';
import { selectTrackLengthInDays, selectTrackTimeEnvelope } from '../selectors/tracks';

import Arrow from '../common/images/icons/track-arrow.svg?url';

const ARROW_IMG_ID = 'track_arrow';

const TRACK_SEGMENTS_SOURCE = 'track-segments-source';
const TRACK_SEGMENTS_LAYER_ID = 'track-segments-layer';
const TRACK_SEGMENTS_START_LAYER_ID = 'track-segments-start-layer';

const VECTOR_TILE_BASE = `${API_URL}observations/segments/tiles/{z}/{x}/{y}.pbf`;

const buildVectorTileUrl = (rangeParam) =>
  `${VECTOR_TILE_BASE}?range=${rangeParam}`;

// Server-controlled styling: match TracksLayer/track.js TRACK_LAYER_LINE_PAINT.
// Vector tiles may use snake_case (stroke_width); support both.
const STABLE_RANDOM_TRACK_COLOR_BASED_ON_SUBJECT_ID = [
  'rgb',
  ['random', 64, 224, ['concat', ['get', 'subject_id'], '-r']],
  ['random', 64, 224, ['concat', ['get', 'subject_id'], '-g']],
  ['random', 64, 224, ['concat', ['get', 'subject_id'], '-b']]
];

const TRACK_SEGMENTS_LINE_PAINT = {
  'line-color': [
    'case',
    ['all',
      ['has', 'stroke'],
      ['!=', ['get', 'stroke'], '']
    ],
    ['to-color', ['get', 'stroke']],
    STABLE_RANDOM_TRACK_COLOR_BASED_ON_SUBJECT_ID,
  ],
  'line-width': [
    'step',
    ['zoom'],
    3,
    8,
    ['*',
      ['case',
        ['has', 'stroke-width'], ['get', 'stroke-width'],
        ['has', 'stroke_width'], ['get', 'stroke_width'],
        1
      ],
      1.75
    ]
  ],
  'line-opacity': [
    'case',
    ['has', 'stroke-opacity'], ['get', 'stroke-opacity'],
    ['has', 'stroke_opacity'], ['get', 'stroke_opacity'],
    0.8
  ],
};

const TrackSegmentsLayer = ({ onPointClick }) => {
  const map = useContext(MapContext);

  const isTimeOfDayColoringActive = useSelector((state) => state.view.trackSettings.isTimeOfDayColoringActive);
  const timeOfDayTimeZone = useSelector((state) => state.view.trackSettings.timeOfDayTimeZone);
  const isSegmentOnTimeEnabled = useSelector((state) => state.view.trackSettings.isSegmentOnTimeEnabled);
  const isSegmentOnSpeedEnabled = useSelector((state) => state.view.trackSettings.isSegmentOnSpeedEnabled);
  const segmentTimeGapLength = useSelector((state) => state.view.trackSettings.segmentTimeGapLength);
  const segmentSpeedLimit = useSelector((state) => state.view.trackSettings.segmentSpeedLimit);

  const subjectTrackState = useSelector((state) => state.view.subjectTrackState);
  const trackTimeEnvelope = useSelector(selectTrackTimeEnvelope);
  const trackLengthInDays = useSelector(selectTrackLengthInDays);
  const rangeParam = trackLengthInDays <= 45 ? '45' : 'all';
  const visibleSubjectIds = uniq([
    ...subjectTrackState.pinned,
    ...subjectTrackState.visible,
  ]);

  /* add arrow image to map */
  useEffect(() => {
    if (!map) return;

    if (!map.hasImage(ARROW_IMG_ID)) {
      addMapImage({ src: Arrow, id: ARROW_IMG_ID });
    }
  }, [map]);

  /* add the vector source (URL includes range=45|all); only clean up on unmount */
  useEffect(() => {
    if (!map) return;

    if (!map.getSource(TRACK_SEGMENTS_SOURCE)) {
      map.addSource(TRACK_SEGMENTS_SOURCE, {
        type: 'vector',
        tiles: [buildVectorTileUrl(rangeParam)],
        minzoom: 0,
        maxzoom: 22,
      });
    }

    /* add the line layer */
    if (!map.getLayer(TRACK_SEGMENTS_LAYER_ID)) {
      map.addLayer({
        id: TRACK_SEGMENTS_LAYER_ID,
        type: 'line',
        source: TRACK_SEGMENTS_SOURCE,
        'source-layer': 'observation_segments',
        minzoom: 3,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          'visibility': 'visible'
        },
        paint: TRACK_SEGMENTS_LINE_PAINT
      });
    }

    /* track point layer */
    if (!map.getLayer(TRACK_SEGMENTS_START_LAYER_ID)) {
      map.addLayer({
        id: TRACK_SEGMENTS_START_LAYER_ID,
        type: 'symbol',
        source: TRACK_SEGMENTS_SOURCE,
        'source-layer': 'observation_segments',
        minzoom: 3,
        layout: {
          'icon-image': ARROW_IMG_ID,
          'icon-rotate': ['get', 'bearing_deg'],
          'icon-size': 0.3 / MAP_ICON_SCALE,
          'icon-allow-overlap': true,
          'icon-pitch-alignment': 'map',
          'icon-rotation-alignment': 'map',
          'symbol-placement': 'point',
        },
        paint: {
          'icon-opacity': 0.8
        }
      });
    }

    return () => {
      if (map.getLayer(TRACK_SEGMENTS_START_LAYER_ID)) {
        safeRemoveMapLayer(map, TRACK_SEGMENTS_START_LAYER_ID);
      }
      if (map.getLayer(TRACK_SEGMENTS_LAYER_ID)) {
        safeRemoveMapLayer(map, TRACK_SEGMENTS_LAYER_ID);
      }
      // Do NOT remove the shared vector tile source – SubjectTileLayer owns cleanup on unmount.
    };
  }, [map, rangeParam]);

  /* time-of-day line color: when active, color segments by start_time in selected timezone */
  useEffect(() => {
    if (!map || !map.getLayer(TRACK_SEGMENTS_LAYER_ID)) return;

    const timeZoneOffset = timeOfDayTimeZone ? getTimezoneOffsetMinutes(timeOfDayTimeZone) : 0;
    const lineColor = isTimeOfDayColoringActive
      ? getTimeOfDayLineColorExpression(
        'start_time',
        STABLE_RANDOM_TRACK_COLOR_BASED_ON_SUBJECT_ID,
        timeZoneOffset
      )
      : TRACK_SEGMENTS_LINE_PAINT['line-color'];

    map.setPaintProperty(TRACK_SEGMENTS_LAYER_ID, 'line-color', lineColor);
  }, [map, isTimeOfDayColoringActive, timeOfDayTimeZone]);

  /* update layer filter based on segmentation settings */
  useEffect(() => {
    if (!map || !map.getLayer(TRACK_SEGMENTS_LAYER_ID)) return;

    const filters = ['all', ['in', ['get', 'subject_id'], ['literal', visibleSubjectIds]]];

    // Filter segments to the track time envelope (track length setting).
    // start_time is ISO 8601 formatted on the server for lexicographic comparison.
    if (trackTimeEnvelope.from) {
      filters.push(['>=', ['get', 'start_time'], trackTimeEnvelope.from.toISOString()]);
    }
    if (trackTimeEnvelope.until) {
      filters.push(['<=', ['get', 'start_time'], trackTimeEnvelope.until.toISOString()]);
    }

    // Filter by time gap if enabled
    // time_gap_ms is in milliseconds, segmentTimeGapLength is in seconds
    if (isSegmentOnTimeEnabled) {
      const maxTimeGapMs = segmentTimeGapLength * 1000;
      filters.push(['<=', ['get', 'time_gap_ms'], maxTimeGapMs]);
    }

    // Filter by speed if enabled
    if (isSegmentOnSpeedEnabled) {
      filters.push(['<=', ['get', 'speed_kmh'], segmentSpeedLimit]);
    }

    if (!isEqual(map.getFilter(TRACK_SEGMENTS_LAYER_ID), filters)) {
      map.setFilter(TRACK_SEGMENTS_LAYER_ID, filters);
    }

    if (map.getLayer(TRACK_SEGMENTS_START_LAYER_ID) && !isEqual(map.getFilter(TRACK_SEGMENTS_START_LAYER_ID), filters)) {
      map.setFilter(TRACK_SEGMENTS_START_LAYER_ID, filters);
    }
  }, [map, visibleSubjectIds, trackTimeEnvelope, isSegmentOnTimeEnabled, isSegmentOnSpeedEnabled, segmentTimeGapLength, segmentSpeedLimit]);

  /* click handler for starting point arrows */
  const handleStartPointClick = useCallback((event) => {
    event.preventDefault();
    if (!onPointClick || !event.features?.length) return;

    const feature = event.features[0];
    const { properties, geometry } = feature;

    // Extract the start point coordinates from the LineString
    const startCoords = geometry.type === 'LineString'
      ? geometry.coordinates[0]
      : geometry.coordinates;

    // Transform properties to match TimepointPopup expectations
    const transformedLayer = {
      geometry: {
        type: 'Point',
        coordinates: startCoords,
      },
      properties: {
        name: properties.subject_name,
        time: properties.start_time,
        id: properties.subject_id,
      },
    };

    onPointClick(transformedLayer);
  }, [onPointClick]);

  const onMouseEnter = useCallback(() => {
    if (map) map.getCanvas().style.cursor = 'pointer';
  }, [map]);

  const onMouseLeave = useCallback(() => {
    if (map) map.getCanvas().style.cursor = '';
  }, [map]);

  useMapEventBinding('click', handleStartPointClick, TRACK_SEGMENTS_START_LAYER_ID, !!onPointClick);
  useMapEventBinding('mouseenter', onMouseEnter, TRACK_SEGMENTS_START_LAYER_ID, !!onPointClick);
  useMapEventBinding('mouseleave', onMouseLeave, TRACK_SEGMENTS_START_LAYER_ID, !!onPointClick);

  return null;
};

export default memo(TrackSegmentsLayer);
