import { point } from '@turf/turf';

import { PRIORITY_COLOR_MAP } from './events';

export const TIME_SLIDER_DEFAULT_LABEL_COLOR = 'rgba(255, 255, 255, 0.7)';

const FADE_INTERPOLATION_CAP = 0.3;
const TIME_SLIDER_RECENT_LABEL_COLOR = 'rgba(255, 255, 126, 1)';

const PRIORITY_FILL_COLOR_EXPRESSION = [
  'case',
  ['==', ['get', 'priority'], 100], PRIORITY_COLOR_MAP[100].base,
  ['==', ['get', 'priority'], 200], PRIORITY_COLOR_MAP[200].base,
  ['==', ['get', 'priority'], 300], PRIORITY_COLOR_MAP[300].base,
  PRIORITY_COLOR_MAP[0].base,
];

export const EVENT_GEOMETRY_FILL_PAINT = {
  'fill-color': PRIORITY_FILL_COLOR_EXPRESSION,
  'fill-outline-color': PRIORITY_FILL_COLOR_EXPRESSION,
  'fill-opacity': 0.4,
};

const midpoint = (a, b) => (a + b) / 2;

const getScanLineLatitude = (rings) => {
  const latitudes = rings.flatMap((ring) => ring.map((position) => position[1]));
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const centreLatitude = midpoint(minLatitude, maxLatitude);

  let highestBelowCentre = minLatitude;
  let lowestAboveCentre = maxLatitude;
  latitudes.forEach((latitude) => {
    if (latitude <= centreLatitude) {
      highestBelowCentre = Math.max(highestBelowCentre, latitude);
    } else {
      lowestAboveCentre = Math.min(lowestAboveCentre, latitude);
    }
  });

  return midpoint(highestBelowCentre, lowestAboveCentre);
};

const edgeCrossesScanLine = (start, end, scanLatitude) => {
  const startLatitude = start[1];
  const endLatitude = end[1];

  const isHorizontalEdge = startLatitude === endLatitude;
  const isFallingEdge = startLatitude === scanLatitude && endLatitude < scanLatitude;
  const isRisingEdge = endLatitude === scanLatitude && startLatitude < scanLatitude;
  if (isHorizontalEdge || isFallingEdge || isRisingEdge) {
    return false;
  }

  const bothAbove = startLatitude > scanLatitude && endLatitude > scanLatitude;
  const bothBelow = startLatitude < scanLatitude && endLatitude < scanLatitude;
  return !bothAbove && !bothBelow;
};

const edgeCrossingLongitude = (start, end, scanLatitude) => {
  const startLongitude = start[0];
  const endLongitude = end[0];
  if (startLongitude === endLongitude) {
    return startLongitude;
  }

  const startLatitude = start[1];
  const endLatitude = end[1];
  const slope = (endLatitude - startLatitude) / (endLongitude - startLongitude);
  return startLongitude + (scanLatitude - startLatitude) / slope;
};

const getSortedScanLineCrossings = (rings, scanLatitude) => {
  const crossingLongitudes = [];
  rings.forEach((ring) => {
    for (let i = 1; i < ring.length; i++) {
      const start = ring[i - 1];
      const end = ring[i];
      if (edgeCrossesScanLine(start, end, scanLatitude)) {
        crossingLongitudes.push(edgeCrossingLongitude(start, end, scanLatitude));
      }
    }
  });
  return crossingLongitudes.sort((a, b) => a - b);
};

const getWidestInteriorSegmentLongitude = (sortedCrossingLongitudes) => {
  let widestSegmentWidth = -1;
  let widestSegmentMidpoint = null;
  for (let i = 0; i + 1 < sortedCrossingLongitudes.length; i += 2) {
    const segmentStart = sortedCrossingLongitudes[i];
    const segmentEnd = sortedCrossingLongitudes[i + 1];
    const width = segmentEnd - segmentStart;
    if (width > widestSegmentWidth) {
      widestSegmentWidth = width;
      widestSegmentMidpoint = midpoint(segmentStart, segmentEnd);
    }
  }
  return widestSegmentMidpoint;
};

export const interiorPointOnSurface = (feature) => {
  const geometry = feature?.geometry ?? feature;
  if (geometry?.type && geometry.type !== 'Polygon') {
    return null;
  }

  const rings = geometry?.coordinates ?? [];
  if (!rings.length || !rings[0]?.length) {
    return null;
  }

  const scanLatitude = getScanLineLatitude(rings);
  const crossings = getSortedScanLineCrossings(rings, scanLatitude);
  const interiorLongitude = getWidestInteriorSegmentLongitude(crossings);

  if (interiorLongitude === null) {
    return point(rings[0][0]);
  }

  return point([interiorLongitude, scanLatitude]);
};

export const buildEventTypeValueMap = (eventTypes) => {
  const lookup = new Map();
  (eventTypes || []).forEach((eventType) => {
    if (eventType?.value) {
      lookup.set(eventType.value, eventType);
    }
  });
  return lookup;
};

export const normalizeTileEventFeature = (feature, eventTypeValueMap, { idField = 'id' } = {}) => {
  const properties = feature?.properties ?? {};
  const eventType = eventTypeValueMap?.get?.(properties.event_type_value);
  const iconId = eventType?.icon_id || 'generic';
  const baseTitle = (properties.title || eventType?.display) ?? '';
  const displayTitle = [baseTitle, properties.event_time_display].filter(Boolean).join('\n');

  return {
    type: 'Feature',
    geometry: feature?.geometry,
    properties: {
      ...properties,
      id: properties[idField],
      icon_id: iconId,
      display_title: displayTitle,
      event_type: properties.event_type_value,
      updated_at: properties.updated_at_iso,
    },
  };
};

export const isFeatureVisibleAtVirtualDate = (feature, { active, virtualDateIso } = {}) => {
  if (!active || !virtualDateIso) {
    return true;
  }
  return (feature?.properties?.event_time_iso ?? '') <= virtualDateIso;
};

export const resolveEventTimeSliderParameters = (timeSliderState, eventFilterDateRange) => {
  const { active, virtualDate } = timeSliderState ?? {};
  if (!active) {
    return { active: false };
  }

  const resolvedVirtualDate = virtualDate ? new Date(virtualDate) : new Date();
  const { lower, upper } = eventFilterDateRange ?? {};

  return {
    active: true,
    totalRangeDistance: (upper ? new Date(upper) : new Date()) - new Date(lower),
    virtualDateIso: resolvedVirtualDate.toISOString(),
    virtualDateMs: resolvedVirtualDate.getTime(),
  };
};

export const buildEventTimeSliderHideFilter = (active, virtualDateIso) =>
  (active ? ['<=', ['coalesce', ['get', 'event_time_iso'], ''], virtualDateIso] : null);

export const buildEventTimeSliderFadeColor = (active, totalRangeDistance, virtualDateMs) => {
  if (!active || !totalRangeDistance) {
    return TIME_SLIDER_DEFAULT_LABEL_COLOR;
  }

  return [
    'case',
    ['has', 'event_time_ms'],
    [
      'interpolate',
      ['linear'],
      ['/', ['abs', ['-', virtualDateMs, ['get', 'event_time_ms']]], totalRangeDistance],
      0, TIME_SLIDER_RECENT_LABEL_COLOR,
      FADE_INTERPOLATION_CAP, TIME_SLIDER_DEFAULT_LABEL_COLOR,
    ],
    TIME_SLIDER_DEFAULT_LABEL_COLOR,
  ];
};
