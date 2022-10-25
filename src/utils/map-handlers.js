import uniqBy from 'lodash/uniqBy';

import { LAYER_PICKER_IDS } from '../constants';

export const queryMultiLayerClickFeatures = (map, event) => {
  const clickedLayersOfInterest = uniqBy(
    map.queryRenderedFeatures(
      event.point,
      { layers: LAYER_PICKER_IDS.filter(id => !!map.getLayer(id)) }
    ),
    layer => layer.properties.id
  );

  return clickedLayersOfInterest;
};

export const withMultiLayerHandlerAwareness = (map, fn) => (event) => {
  const multiSelectLayers = queryMultiLayerClickFeatures(map, event);

  if (multiSelectLayers.length > 1) return null;

  return fn(event);
};