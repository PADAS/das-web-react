import { memo, useCallback, useContext, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { LAYER_IDS, MAP_ICON_SCALE } from '../constants';
import { MapContext } from '../App';
import { useMapEventBinding } from '../hooks';
import { getTimeOfDayLineColorExpression, safeRemoveMapLayer, safeRemoveMapSource } from '../utils/map';
import { getTimezoneOffsetMinutes } from '../utils/datetime';
import { isBuoySubject } from '../utils/subjects';

const { SUBJECT_SYMBOLS, TRACKS_LINES, TRACKS_SOURCE, TRACK_TIMEPOINTS } = LAYER_IDS;

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

const EMPTY_FC = { type: 'FeatureCollection', features: [] };

const TrackLayer = ({
  before = null,
  id = null,
  lineLayout = {},
  linePaint = {},
  onPointClick,
  onTrackLabelClick,
  showTimepoints = true,
  trackData,
}) => {
  const map = useContext(MapContext);

  const isTimeOfDayColoringActive = useSelector(
    (state) => state.view.trackSettings.isTimeOfDayColoringActive
  );
  const timeOfDayTimeZone = useSelector(
    (state) => state.view.trackSettings.timeOfDayTimeZone
  );
  const subjectStore = useSelector((state) => state.data.subjectStore);

  const trackId = id;

  const subject = subjectStore[trackId];
  const isRopelessBuoyGearset = isBuoySubject(subject);

  const onSymbolMouseEnter = () => map.getCanvas().style.cursor = 'pointer';
  const onSymbolMouseLeave = () => map.getCanvas().style.cursor = '';

  const sourceId = `${TRACKS_SOURCE}-${trackId}`;
  const pointSourceId = `${sourceId}-points`;

  const layerId = `${TRACKS_LINES}-${trackId}`;
  const pointLayerId = `${TRACK_TIMEPOINTS}-${trackId}`;

  const todSourceId = `${sourceId}-tod`;
  const todLayerId = `${layerId}-tod`;
  const trackLabelLayerId = `${layerId}-label`;
  const trackLabelSourceId = `${sourceId}-label`;

  const timepointLayout = useMemo(() => ({
    ...TIMEPOINT_LAYER_LAYOUT,
    'icon-image': isRopelessBuoyGearset ? 'dot-11' : 'track_arrow',
    'icon-size': isRopelessBuoyGearset
      ? ['interpolate', ['linear'], ['zoom'], 0, 1.2, 11, 1.5, 15, 2.0]
      : TIMEPOINT_LAYER_LAYOUT['icon-size'],
    'icon-rotate': isRopelessBuoyGearset ? 0 : ['get', 'bearing'],
    'icon-allow-overlap': isRopelessBuoyGearset ? true : TIMEPOINT_LAYER_LAYOUT['icon-allow-overlap'],
    'icon-anchor': isRopelessBuoyGearset ? 'center' : 'bottom',
    'icon-rotation-alignment': isRopelessBuoyGearset ? 'viewport' : 'map',
    'icon-pitch-alignment': isRopelessBuoyGearset ? 'viewport' : 'map',
  }), [isRopelessBuoyGearset]);

  const trackLabelText = useMemo(() => {
    if (!isRopelessBuoyGearset || !subject) return '';
    const manufacturer = subject.additional?.manufacturer || '';
    const displayId = subject.additional?.display_id || '';
    if (manufacturer && displayId) return `${manufacturer}: ${displayId}`;
    return manufacturer || displayId || '';
  }, [isRopelessBuoyGearset, subject]);

  const trackLabelSource = useMemo(() => {
    if (!isRopelessBuoyGearset || !trackData.track.features.length) return null;
    return { type: 'FeatureCollection', features: [trackData.track.features[0]] };
  }, [isRopelessBuoyGearset, trackData.track.features]);

  /* create base sources + layers; full teardown on unmount */
  useEffect(() => {
    if (!map) return;

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, { type: 'geojson', data: trackData.track, tolerance: 1.5, lineMetrics: true });
    }
    if (!map.getSource(pointSourceId)) {
      map.addSource(pointSourceId, { type: 'geojson', data: trackData.points });
    }

    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: { ...TRACK_LAYER_LINE_LAYOUT, ...lineLayout },
        paint: { ...TRACK_LAYER_LINE_PAINT, ...linePaint },
      }, before || SUBJECT_SYMBOLS);
    }

    if (!map.getLayer(pointLayerId)) {
      map.addLayer({
        id: pointLayerId,
        type: 'symbol',
        source: pointSourceId,
        layout: timepointLayout,
        paint: TIMEPOINT_LAYER_PAINT,
      }, before || `${SUBJECT_SYMBOLS}-unclustered`);
    }

    if (isRopelessBuoyGearset) {
      if (!map.getSource(trackLabelSourceId)) {
        map.addSource(trackLabelSourceId, {
          type: 'geojson', data: trackLabelSource || EMPTY_FC, tolerance: 1.5, lineMetrics: true,
        });
      }
      if (!map.getLayer(trackLabelLayerId)) {
        map.addLayer({
          id: trackLabelLayerId,
          type: 'symbol',
          source: trackLabelSourceId,
          paint: { 'text-color': '#ffffff', 'text-halo-color': '#000000', 'text-halo-width': 2 },
          layout: {
            'symbol-placement': 'line-center',
            'text-field': trackLabelText,
            'text-font': ['Open Sans Regular'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 0, 10, 14, 14],
            'text-anchor': 'center',
            'text-offset': [0, -3],
          },
        }, before || SUBJECT_SYMBOLS);
      }
    }

    return () => {
      [todLayerId, trackLabelLayerId, pointLayerId, layerId].forEach((lid) => {
        if (map.getLayer(lid)) safeRemoveMapLayer(map, lid);
      });
      [todSourceId, trackLabelSourceId, pointSourceId, sourceId].forEach((sid) => {
        if (map.getSource(sid)) safeRemoveMapSource(map, sid);
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  /* push fresh GeoJSON data into base sources */
  useEffect(() => {
    if (!map) return;
    const src = map.getSource(sourceId);
    if (src?.setData) src.setData(trackData.track);
    const ptSrc = map.getSource(pointSourceId);
    if (ptSrc?.setData) ptSrc.setData(trackData.points);
  }, [map, sourceId, pointSourceId, trackData.track, trackData.points]);

  /* sync line paint overrides (e.g. patrol opacity) */
  useEffect(() => {
    if (!map || !map.getLayer(layerId)) return;
    const merged = { ...TRACK_LAYER_LINE_PAINT, ...linePaint };
    Object.entries(merged).forEach(([k, v]) => map.setPaintProperty(layerId, k, v));
  }, [map, layerId, linePaint]);

  /* time-of-day coloring: single source + layer with color expression */
  useEffect(() => {
    if (!map) return;

    const hasTod = isTimeOfDayColoringActive && trackData.trackSegments?.features?.length > 0;

    if (hasTod) {
      const offset = timeOfDayTimeZone ? getTimezoneOffsetMinutes(timeOfDayTimeZone) : 0;
      const colorExpr = getTimeOfDayLineColorExpression(
        'startTime', TRACK_LAYER_LINE_PAINT['line-color'], offset
      );

      const src = map.getSource(todSourceId);
      if (src) {
        src.setData(trackData.trackSegments);
      } else {
        map.addSource(todSourceId, { type: 'geojson', data: trackData.trackSegments, tolerance: 1.5 });
      }

      if (!map.getLayer(todLayerId)) {
        map.addLayer({
          id: todLayerId,
          type: 'line',
          source: todSourceId,
          layout: { ...TRACK_LAYER_LINE_LAYOUT, ...lineLayout },
          paint: { 'line-color': colorExpr, 'line-width': 3 },
        }, before || SUBJECT_SYMBOLS);
      } else {
        map.setPaintProperty(todLayerId, 'line-color', colorExpr);
      }
    } else {
      if (map.getLayer(todLayerId)) safeRemoveMapLayer(map, todLayerId);
      if (map.getSource(todSourceId)) safeRemoveMapSource(map, todSourceId);
    }

    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', hasTod ? 'none' : 'visible');
    }
  }, [map, trackData.trackSegments, isTimeOfDayColoringActive, timeOfDayTimeZone,
    todSourceId, todLayerId, layerId, lineLayout, before]);

  /* timepoint arrow visibility */
  useEffect(() => {
    if (!map || !map.getLayer(pointLayerId)) return;
    map.setLayoutProperty(pointLayerId, 'visibility', showTimepoints ? 'visible' : 'none');
  }, [map, pointLayerId, showTimepoints]);

  /* buoy label data + text updates */
  useEffect(() => {
    if (!map || !isRopelessBuoyGearset) return;
    const src = map.getSource(trackLabelSourceId);
    if (src?.setData) src.setData(trackLabelSource || EMPTY_FC);
    if (map.getLayer(trackLabelLayerId)) {
      map.setLayoutProperty(trackLabelLayerId, 'text-field', trackLabelText);
    }
  }, [map, isRopelessBuoyGearset, trackLabelSourceId, trackLabelLayerId, trackLabelSource, trackLabelText]);

  const onLabelClick = useCallback((event) => {
    if (!subject || !onTrackLabelClick) return;
    const { lngLat } = event;
    const syntheticLayer = {
      properties: {
        ...subject,
        coordinateProperties: subject.last_position?.properties?.coordinateProperties
      },
      geometry: { type: 'Point', coordinates: [lngLat.lng, lngLat.lat] }
    };
    onTrackLabelClick({ event, layer: syntheticLayer });
  }, [subject, onTrackLabelClick]);

  const onBuoyTimepointClick = useCallback((event) => {
    if (!subject || !onTrackLabelClick) return;
    const { lngLat } = event;
    const syntheticLayer = {
      properties: {
        ...subject,
        coordinateProperties: subject.last_position?.properties?.coordinateProperties
      },
      geometry: { type: 'Point', coordinates: [lngLat.lng, lngLat.lat] }
    };
    onTrackLabelClick({ event, layer: syntheticLayer });
  }, [subject, onTrackLabelClick]);

  useMapEventBinding('click', isRopelessBuoyGearset ? onBuoyTimepointClick : onPointClick, pointLayerId, showTimepoints);
  useMapEventBinding('mouseenter', onSymbolMouseEnter, pointLayerId, showTimepoints);
  useMapEventBinding('mouseleave', onSymbolMouseLeave, pointLayerId, showTimepoints);

  useMapEventBinding('click', onLabelClick, trackLabelLayerId, isRopelessBuoyGearset && trackLabelText !== '');
  useMapEventBinding('mouseenter', onSymbolMouseEnter, trackLabelLayerId, isRopelessBuoyGearset && trackLabelText !== '');
  useMapEventBinding('mouseleave', onSymbolMouseLeave, trackLabelLayerId, isRopelessBuoyGearset && trackLabelText !== '');

  return null;
};

export default memo(TrackLayer);
