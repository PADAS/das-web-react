import React, { memo, useCallback, useContext, useEffect, useState } from 'react';
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

const MapDrawingLayers = ({ drawing, drawnLineSegments, fillPolygon, isHoveringGeometry, setIsHoveringGeometry }) => {
  const map = useContext(MapContext);

  const [isHoveringPolygonFill, setIsHoveringPolygonFill] = useState(false);
  const [isHoveringCircle, setIsHoveringCircle] = useState(false);

  useMapSource(SOURCE_IDS.LINE_SOURCE, drawnLineSegments, { type: 'geojson' });
  useMapSource(SOURCE_IDS.FILL_SOURCE, fillPolygon, { type: 'geojson' });

  useMapLayer(LAYER_IDS.LABELS, 'symbol', SOURCE_IDS.LINE_SOURCE, symbolPaint, symbolLayout, {
    condition: drawing || !isHoveringGeometry,
  });
  useMapLayer(LAYER_IDS.LINES, 'line', SOURCE_IDS.LINE_SOURCE, linePaint, lineLayout);
  const fillLayer = useMapLayer(LAYER_IDS.FILL, 'fill', SOURCE_IDS.FILL_SOURCE, fillPaint, fillLayout);
  const pointsLayer = useMapLayer(LAYER_IDS.POINTS, 'circle', SOURCE_IDS.LINE_SOURCE, circlePaint);

  const onCircleMouseEnter = useCallback(() => {
    setIsHoveringCircle(true);
    map.getCanvas().style.cursor = 'pointer';
  }, [map]);
  const onCircleMouseLeave = useCallback(() => {
    setIsHoveringCircle(false);
    map.getCanvas().style.cursor = '';
  }, [map]);
  const onFillMouseEnter = useCallback(() => setIsHoveringPolygonFill(true), []);
  const onFillMouseLeave = useCallback(() => setIsHoveringPolygonFill(false), []);

  useMapEventBinding('mouseenter', onCircleMouseEnter, LAYER_IDS.POINTS, !!pointsLayer);
  useMapEventBinding('mouseleave', onCircleMouseLeave, LAYER_IDS.POINTS, !!pointsLayer);
  useMapEventBinding('mouseenter', onFillMouseEnter, LAYER_IDS.FILL, !!fillLayer);
  useMapEventBinding('mouseleave', onFillMouseLeave, LAYER_IDS.FILL, !!fillLayer);

  useEffect(() => {
    setIsHoveringGeometry(isHoveringCircle || isHoveringPolygonFill);
  }, [isHoveringCircle, isHoveringPolygonFill, setIsHoveringGeometry]);

  return null;
};

export default memo(MapDrawingLayers);
