import { point } from '@turf/turf';

import { DEFAULT_SYMBOL_LAYOUT, MAP_ICON_SCALE } from '../constants';
import { PRIORITY_COLOR_MAP } from './events';

export const TIME_SLIDER_DEFAULT_LABEL_COLOR = 'rgba(255, 255, 255, 0.7)';

const FADE_INTERPOLATION_CAP = 0.3;
const TIME_SLIDER_RECENT_LABEL_COLOR = 'rgba(255, 255, 126, 1)';

// Fill color by priority.
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

// Builds the icon layout for an event symbol layer. The two pieces a caller
// varies are injected: iconIdExpression (how to read the icon id) and
// ifIsGeneric (generic events render smaller).
export const buildEventIconLayout = ({ iconIdExpression, ifIsGeneric }) => ({
  ...DEFAULT_SYMBOL_LAYOUT,
  'icon-allow-overlap': true,
  'text-allow-overlap': true,
  // Sprite id encodes icon + priority + optional size, e.g. "generic-200-78".
  'icon-image': [
    'concat',
    iconIdExpression,
    '-',
    ['get', 'priority'],
    ['case', ['has', 'width'], ['concat', '-', ['get', 'width']], ''],
    ['case', ['has', 'height'], ['concat', '-', ['get', 'height']], ''],
  ],
  // Scale icons up with zoom; generic icons stay smaller than typed ones at
  // every level.
  'icon-size': [
    'interpolate', ['exponential', 0.5], ['zoom'],
    0, ifIsGeneric(0.125 / MAP_ICON_SCALE, 0.25 / MAP_ICON_SCALE),
    12, ifIsGeneric(0.5 / MAP_ICON_SCALE, 1 / MAP_ICON_SCALE),
  ],
  // Text lives on a separate label layer; the icon layer renders no text.
  'text-field': '',
  'text-size': 0,
});

const midpoint = (a, b) => (a + b) / 2;

// Pick the latitude to scan along: near the polygon's vertical centre, but
// nudged to the midpoint between the nearest vertices above and below it,
// keeps the line off any vertex, where the edge-crossing math degenerates.
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

// Does this edge properly cross the scan line? Horizontal edges and edges that
// only touch the line at a vertex are excluded so each true crossing is
// counted exactly once.
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

// Longitude at which the edge intersects the scan latitude.
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

// Longitudes where the polygon's edges cross the scan line, left to right.
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

// Sorted crossings pair up into interior chords (in→out, in→out, ...). Return
// the midpoint of the widest chord, that point is guaranteed interior even
// for concave or donut polygons.
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

// Returns a point guaranteed to lie inside the polygon (a port of GEOS's
// InteriorPointArea).
export const interiorPointOnSurface = (feature) => {
  const geometry = feature?.geometry ?? feature;
  if (geometry?.type && geometry.type !== 'Polygon') {
    return null;
  }

  const rings = geometry?.coordinates ?? [];
  if (!rings.length || !rings[0]?.length) {
    return null;
  }

  // Scan a horizontal line across the polygon and take the midpoint of its
  // widest interior chord.
  const scanLatitude = getScanLineLatitude(rings);
  const crossings = getSortedScanLineCrossings(rings, scanLatitude);
  const interiorLongitude = getWidestInteriorSegmentLongitude(crossings);

  // No interior chord found (degenerate geometry), fall back to the first
  // vertex.
  if (interiorLongitude === null) {
    return point(rings[0][0]);
  }

  return point([interiorLongitude, scanLatitude]);
};

// Index event types by their value.
export const buildEventTypeValueMap = (eventTypes) => {
  const lookup = new Map();
  (eventTypes || []).forEach((eventType) => {
    if (eventType?.value) {
      lookup.set(eventType.value, eventType);
    }
  });
  return lookup;
};

// Reshape a raw vector-tile feature into the flattened event-feature shape
// used across the map.
export const normalizeTileEventFeature = (feature, eventTypeValueMap, { idField = 'id' } = {}) => {
  const properties = feature?.properties ?? {};
  const eventType = eventTypeValueMap?.get?.(properties.event_type_value);
  const iconId = eventType?.icon_id || 'generic';
  // Label text is the title over the event time.
  const baseTitle = (properties.title || eventType?.display) ?? '';
  const displayTitle = [baseTitle, properties.event_time_display].filter(Boolean).join('\n');

  return {
    type: 'Feature',
    // Read geometry explicitly: it is a lazy getter on tile features that a
    // spread would drop.
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

// Predicate form of the time-slider hide, for filtering features in JS rather
// than via a Mapbox expression.
export const isFeatureVisibleAtVirtualDate = (feature, { active, virtualDateIso } = {}) => {
  if (!active || !virtualDateIso) {
    return true;
  }
  return (feature?.properties?.event_time_iso ?? '') <= virtualDateIso;
};

// Resolves the time-slider state into the values the hide filter and fade
// color consume.
export const resolveEventTimeSliderParameters = (timeSliderState, eventFilterDateRange) => {
  const { active, virtualDate } = timeSliderState ?? {};
  if (!active) {
    return { active: false };
  }

  const resolvedVirtualDate = virtualDate ? new Date(virtualDate) : new Date();
  const { lower, upper } = eventFilterDateRange ?? {};

  return {
    active: true,
    // Span of the filter's date range, the distance the fade interpolates
    // over.
    totalRangeDistance: (upper ? new Date(upper) : new Date()) - new Date(lower),
    // ISO for the lexicographic hide compare; ms for the fade arithmetic.
    virtualDateIso: resolvedVirtualDate.toISOString(),
    virtualDateMs: resolvedVirtualDate.getTime(),
  };
};

// Filter expression hiding events newer than the virtual date.
export const buildEventTimeSliderHideFilter = (active, virtualDateIso) =>
  (active ? ['<=', ['coalesce', ['get', 'event_time_iso'], ''], virtualDateIso] : null);

// Paint expression that tints the label pill: events at the virtual moment
// glow, fading to the default color once they are FADE_INTERPOLATION_CAP of
// the range away.
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
