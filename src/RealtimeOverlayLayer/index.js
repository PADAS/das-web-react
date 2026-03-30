import { memo, useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { featureCollection } from '@turf/turf';

import { MapContext } from '../App';
import {
  addFeatureCollectionImagesToMap,
  getTimeOfDayLineColorExpression,
  safeRemoveMapLayer,
  safeRemoveMapSource,
} from '../utils/map';
import { getTimezoneOffsetMinutes } from '../utils/datetime';

const OVERLAY_SUBJECTS_SOURCE = 'realtime-overlay-subjects';
const OVERLAY_SEGMENTS_SOURCE = 'realtime-overlay-segments';
const OVERLAY_SEGMENTS_LAYER_ID = 'realtime-overlay-segments-layer';
const OVERLAY_SUBJECTS_LAYER_ID = 'realtime-overlay-subjects-layer';

// Same server-driven styling as TrackSegmentsLayer for segment lines.
const STABLE_RANDOM_TRACK_COLOR_BASED_ON_SUBJECT_ID = [
  'rgb',
  ['random', 64, 224, ['concat', ['get', 'subject_id'], '-r']],
  ['random', 64, 224, ['concat', ['get', 'subject_id'], '-g']],
  ['random', 64, 224, ['concat', ['get', 'subject_id'], '-b']]
];

const OVERLAY_SEGMENTS_LINE_PAINT = {
  'line-color': [
    'case',
    ['all', ['has', 'stroke'], ['!=', ['get', 'stroke'], '']],
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

const RealtimeOverlayLayer = ({ onSubjectClick }) => {
  const map = useContext(MapContext);
  const overlay = useSelector((state) => state.data.realtimeOverlay);
  const isTimeOfDayColoringActive = useSelector(
    (state) => state.view.trackSettings.isTimeOfDayColoringActive
  );
  const timeOfDayTimeZone = useSelector((state) => state.view.trackSettings.timeOfDayTimeZone);

  const overlaySubjects = overlay?.subjects && overlay.subjects.type === 'FeatureCollection'
    ? overlay.subjects
    : featureCollection([]);
  const overlaySegments = overlay?.segments && overlay.segments.type === 'FeatureCollection'
    ? overlay.segments
    : featureCollection([]);

  useEffect(() => {
    if (!map) return;

    if (!map.getSource(OVERLAY_SUBJECTS_SOURCE)) {
      map.addSource(OVERLAY_SUBJECTS_SOURCE, {
        type: 'geojson',
        data: overlaySubjects,
      });
    }
    if (!map.getSource(OVERLAY_SEGMENTS_SOURCE)) {
      map.addSource(OVERLAY_SEGMENTS_SOURCE, {
        type: 'geojson',
        data: overlaySegments,
        lineMetrics: true,
      });
    }

    if (!map.getLayer(OVERLAY_SEGMENTS_LAYER_ID)) {
      map.addLayer({
        id: OVERLAY_SEGMENTS_LAYER_ID,
        type: 'line',
        source: OVERLAY_SEGMENTS_SOURCE,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: OVERLAY_SEGMENTS_LINE_PAINT,
      });
    }

    if (!map.getLayer(OVERLAY_SUBJECTS_LAYER_ID)) {
      map.addLayer({
        id: OVERLAY_SUBJECTS_LAYER_ID,
        type: 'symbol',
        source: OVERLAY_SUBJECTS_SOURCE,
        layout: {
          'icon-image': [
            'case',
            ['==', ['get', 'subject_subtype'], 'ropeless_buoy_gearset'],
            'za-provincial-2',
            ['concat',
              ['get', 'image'],
              '-',
              ['case', ['has', 'width'], ['get', 'width'], 'x'],
              '-',
              ['case', ['has', 'height'], ['get', 'height'], 'x'],
            ],
          ],
          'icon-size': [
            'interpolate', ['exponential', 0.5], ['zoom'],
            0, 0.2 / 3,
            11, 0.8 / 3,
            14, 1 / 3,
          ],
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        },
        paint: {
          'icon-opacity': [
            'case',
            ['==', ['get', 'subject_subtype'], 'ropeless_buoy_gearset'], 0.5,
            1,
          ],
        },
      });
    }

    return () => {
      safeRemoveMapLayer(map, OVERLAY_SUBJECTS_LAYER_ID);
      safeRemoveMapLayer(map, OVERLAY_SEGMENTS_LAYER_ID);
      safeRemoveMapSource(map, OVERLAY_SUBJECTS_SOURCE);
      safeRemoveMapSource(map, OVERLAY_SEGMENTS_SOURCE);
    };
  }, [map]);

  useEffect(() => {
    if (overlaySubjects?.features?.length && map) {
      addFeatureCollectionImagesToMap(overlaySubjects);
    }
  }, [map, overlaySubjects]);

  useEffect(() => {
    if (!map) return;
    const subjectSource = map.getSource(OVERLAY_SUBJECTS_SOURCE);
    const segmentSource = map.getSource(OVERLAY_SEGMENTS_SOURCE);
    if (subjectSource && subjectSource.setData) {
      subjectSource.setData(overlaySubjects);
    }
    if (segmentSource && segmentSource.setData) {
      segmentSource.setData(overlaySegments);
    }
  }, [map, overlaySubjects, overlaySegments]);

  /* time-of-day line color: when active, color segments by start_time in selected timezone */
  useEffect(() => {
    if (!map || !map.getLayer(OVERLAY_SEGMENTS_LAYER_ID)) return;

    const timeZoneOffset = timeOfDayTimeZone ? getTimezoneOffsetMinutes(timeOfDayTimeZone) : 0;
    const lineColor = isTimeOfDayColoringActive
      ? getTimeOfDayLineColorExpression(
        'start_time',
        STABLE_RANDOM_TRACK_COLOR_BASED_ON_SUBJECT_ID,
        timeZoneOffset
      )
      : OVERLAY_SEGMENTS_LINE_PAINT['line-color'];

    map.setPaintProperty(OVERLAY_SEGMENTS_LAYER_ID, 'line-color', lineColor);
  }, [map, isTimeOfDayColoringActive, timeOfDayTimeZone]);

  return null;
};

export default memo(RealtimeOverlayLayer);
