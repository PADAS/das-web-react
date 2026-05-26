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
  LAYER_IDS.GEAR_LINE,
  LAYER_IDS.GEAR_POINT,
  LAYER_IDS.SUBJECT_SYMBOLS,
  `${LAYER_IDS.SUBJECT_SYMBOLS}-labels`,
];

export const queryMultiLayerClickFeatures = (map, event) => uniqBy(
  map.queryRenderedFeatures(
    event.point,
    { layers: LAYER_PICKER_IDS.filter((id) => !!map.getLayer(id)) }
  ),
  (layer) => layer.properties.id
);

export const withMultiLayerHandlerAwareness = (map, fn) => (event) =>
  queryMultiLayerClickFeatures(map, event).length > 1 ? null : fn(event);
