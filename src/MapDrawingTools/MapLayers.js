import React, { memo, useCallback, useContext, useEffect } from 'react';
import { MapContext } from '../App';

import { useMapEventBinding, useMapLayer, useMapSource } from '../hooks';

import { linePaint, lineLayout, circlePaint, fillLayout, fillPaint, symbolPaint, symbolLayout } from './layerStyles';

export const RULER_POINTS_LAYER_ID = 'RULER_POINTS_LAYER_ID';

export const LAYER_IDS = {
  POINTS: 'draw-layer-points',
  LINES: 'draw-layer-lines',
  LABELS: 'draw-layer-labels',
  FILL: 'draw-layer-fill',
};

export const SOURCE_IDS = {
  LINE_SOURCE: 'map-line-source',
  FILL_SOURCE: 'map-fill-source',
};

const MapDrawingLayers = (props) => {
  const {
    drawnLineSegments, fillPolygon,
  } = props;

  const map = useContext(MapContext);

  useMapSource(SOURCE_IDS.LINE_SOURCE, drawnLineSegments, { type: 'geojson' });
  useMapSource(SOURCE_IDS.FILL_SOURCE, fillPolygon, { type: 'geojson' });

  const onCircleMouseEnter = useCallback(() => map.getCanvas().style.cursor = 'pointer', [map]);
  const onCircleMouseLeave = useCallback(() => map.getCanvas().style.cursor = '', [map]);

  useMapLayer(LAYER_IDS.LINES, 'line', SOURCE_IDS.LINE_SOURCE, linePaint, lineLayout);
  useMapLayer(LAYER_IDS.LABELS, 'symbol', SOURCE_IDS.LINE_SOURCE, symbolPaint, symbolLayout);
  useMapLayer(LAYER_IDS.FILL, 'fill', SOURCE_IDS.FILL_SOURCE, fillPaint, fillLayout);
  const circleLayer = useMapLayer(LAYER_IDS.POINTS, 'circle', SOURCE_IDS.LINE_SOURCE, circlePaint);

  useMapEventBinding('mouseenter', onCircleMouseEnter, LAYER_IDS.POINTS, !!circleLayer);
  useMapEventBinding('mouseleave', onCircleMouseLeave, LAYER_IDS.POINTS, !!circleLayer);

  return null;
};

export default memo(MapDrawingLayers);
