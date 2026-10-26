import uniqBy from 'lodash/uniqBy';

import { LAYER_IDS } from '../constants';

const LAYER_PICKER_IDS = [
  LAYER_IDS.ANALYZER_LINES_CRITICAL,
  LAYER_IDS.ANALYZER_LINES_WARNING,
  LAYER_IDS.ANALYZER_POLYS_CRITICAL,
  LAYER_IDS.ANALYZER_POLYS_WARNING,
  LAYER_IDS.EVENT_GEOMETRY_LAYER,
  LAYER_IDS.EVENT_SYMBOLS,
  `${LAYER_IDS.EVENT_SYMBOLS}-labels`,
  LAYER_IDS.EVENTS_REALTIME_OVERLAY_GEOMETRY,
  LAYER_IDS.EVENTS_REALTIME_OVERLAY_SYMBOLS,
  `${LAYER_IDS.EVENTS_REALTIME_OVERLAY_SYMBOLS}-labels`,
  LAYER_IDS.EVENTS_VECTOR_CENTROID_SYMBOLS,
  `${LAYER_IDS.EVENTS_VECTOR_CENTROID_SYMBOLS}-labels`,
  LAYER_IDS.EVENTS_VECTOR_CLUSTER_SYMBOLS,
  `${LAYER_IDS.EVENTS_VECTOR_CLUSTER_SYMBOLS}-labels`,
  LAYER_IDS.EVENTS_VECTOR_GEOMETRY,
  LAYER_IDS.EVENTS_VECTOR_SYMBOLS,
  `${LAYER_IDS.EVENTS_VECTOR_SYMBOLS}-labels`,
  LAYER_IDS.GEAR_LINE_HIT,
  LAYER_IDS.GEAR_POINT,
  LAYER_IDS.SUBJECT_SYMBOLS,
  `${LAYER_IDS.SUBJECT_SYMBOLS}-labels`,
];

const POLYGON_TILE_LAYER_IDS = new Set([
  LAYER_IDS.EVENTS_VECTOR_CENTROID_SYMBOLS,
  `${LAYER_IDS.EVENTS_VECTOR_CENTROID_SYMBOLS}-labels`,
  LAYER_IDS.EVENTS_VECTOR_GEOMETRY,
]);

// Rekey a clicked polygon feature to its event id. Scoped to the polygon
// layers so it never touches other features.
const normalizeClickFeatureId = (feature) => {
  const eventId = feature.properties?.event_id;
  if (eventId == null || !POLYGON_TILE_LAYER_IDS.has(feature.layer?.id)) {
    return feature;
  }
  return {
    ...feature,
    geometry: feature.geometry,
    properties: {
      ...feature.properties,
      id: eventId,
      event_type: feature.properties.event_type ?? feature.properties.event_type_value,
    },
  };
};

export const queryMultiLayerClickFeatures = (map, event) => uniqBy(
  map.queryRenderedFeatures(
    event.point,
    { layers: LAYER_PICKER_IDS.filter((id) => !!map.getLayer(id)) }
  ).map(normalizeClickFeatureId),
  (layer) => layer.properties.id
);

export const withMultiLayerHandlerAwareness = (map, fn) => (event) =>
  queryMultiLayerClickFeatures(map, event).length > 1 ? null : fn(event);
