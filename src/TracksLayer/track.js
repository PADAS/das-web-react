import { memo, useCallback, useContext, useMemo } from 'react';

import { LAYER_IDS, MAP_ICON_SCALE } from '../constants';
import { MapContext } from '../MapContext';
import {
  useMapEventBinding
} from '../hooks';
import { getTimeOfDaySourceAndLayerConfigurations } from './utils';
import { isBuoySubject } from '../utils/subjects';
import { useSelector } from 'react-redux';
import useMapSources from '../hooks/useMapSources';
import useMapLayers from '../hooks/useMapLayers';

const { SUBJECT_SYMBOLS, TRACKS_LINES, TRACKS_SOURCE, TRACK_TIMEPOINTS,  } = LAYER_IDS;

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
  const subjectStore = useSelector((state) => state.data.subjectStore);

  const trackId = id;

  // Check if this is a ropeless_buoy_gearset subject
  const subject = subjectStore[trackId];
  const isRopelessBuoyGearset = isBuoySubject(subject);

  const onSymbolMouseEnter = () => map.getCanvas().style.cursor = 'pointer';
  const onSymbolMouseLeave = () => map.getCanvas().style.cursor = '';

  const sourceId = `${TRACKS_SOURCE}-${trackId}`;
  const pointSourceId = `${sourceId}-points`;

  const layerId = `${TRACKS_LINES}-${trackId}`;
  const pointLayerId = `${TRACK_TIMEPOINTS}-${trackId}`;

  // Use dot-11 icon for ropeless_buoy_gearset subjects with larger size, no rotation, and always visible
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
    layout: timepointLayout,
    options: {
      before: before || `${SUBJECT_SYMBOLS}-unclustered`,
      condition: showTimepoints
    }
  }]);

  // Add track label layer for ropeless_buoy_gearset subjects
  const trackLabelLayerId = `${layerId}-label`;
  const trackLabelSourceId = `${sourceId}-label`;

  const trackLabelText = useMemo(() => {
    if (!isRopelessBuoyGearset || !subject) return '';

    const manufacturer = subject.additional?.manufacturer || '';
    const displayId = subject.additional?.display_id || '';

    if (manufacturer && displayId) {
      return `${manufacturer}: ${displayId}`;
    } else if (manufacturer) {
      return manufacturer;
    } else if (displayId) {
      return displayId;
    }
    return '';
  }, [isRopelessBuoyGearset, subject]);

  // Create source with only the first track feature for the label
  const trackLabelSource = useMemo(() => {
    if (!isRopelessBuoyGearset || !trackData.track.features.length) return null;

    return {
      type: 'FeatureCollection',
      features: [trackData.track.features[0]]
    };
  }, [isRopelessBuoyGearset, trackData.track.features]);

  useMapSources(trackLabelSource ? [{ id: trackLabelSourceId, data: trackLabelSource }] : [], { tolerance: 1.5, type: 'geojson', lineMetrics: true });

  useMapLayers([{
    id: trackLabelLayerId,
    type: 'symbol',
    sourceId: trackLabelSourceId,
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': '#000000',
      'text-halo-width': 2
    },
    layout: {
      'symbol-placement': 'line-center',
      'text-field': trackLabelText,
      'text-font': ['Open Sans Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 0, 10, 14, 14],
      'text-anchor': 'center',
      'text-offset': [0, -3]
    },
    options: {
      before: before || SUBJECT_SYMBOLS,
      condition: isRopelessBuoyGearset && trackLabelText !== ''
    }
  }]);

  // Add event handlers for track label layer
  const onLabelClick = useCallback((event) => {
    if (!subject || !onTrackLabelClick) return;

    const { lngLat } = event;
    // Create synthetic layer object matching the subject layer structure
    const syntheticLayer = {
      properties: {
        ...subject,
        coordinateProperties: subject.last_position?.properties?.coordinateProperties
      },
      geometry: { type: 'Point', coordinates: [lngLat.lng, lngLat.lat] }
    };

    onTrackLabelClick({ event, layer: syntheticLayer });
  }, [subject, onTrackLabelClick]);

  // For ropeless buoy gearsets, timepoint clicks should work like label clicks
  // but show the popup on the clicked timepoint instead of the main subject
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
