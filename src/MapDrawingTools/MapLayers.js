import React, { memo, useCallback, useContext, useEffect, useState } from 'react';
import { MapContext } from '../App';

import { useMapEventBinding, useMapLayer, useMapSource } from '../hooks';

import {
  linePaint,
  lineLayout,
  circlePaint,
  fillLayout,
  fillPaint,
  symbolPaint,
  lineSymbolLayout,
  polygonSymbolLayout,
} from './layerStyles';

export const RULER_POINTS_LAYER_ID = 'RULER_POINTS_LAYER_ID';

export const LAYER_IDS = {
  POINTS: 'draw-layer-points',
  LINES: 'draw-layer-lines',
  LINE_LABELS: 'draw-layer-line-labels',
  FILL: 'draw-layer-fill',
  FILL_LABEL: 'draw-layer-fill-label',
};

export const SOURCE_IDS = {
  FILL_SOURCE: 'map-drawing-tools-fill-source',
  FILL_LABEL_SOURCE: 'map-drawing-tools-fill-label-source',
  LINE_SOURCE: 'map-drawing-tools-line-source',
  POINT_SOURCE: 'map-drawing-tools-point-source',
};

const MapDrawingLayers = ({
  draggedPoint,
  drawing,
  drawnLinePoints,
  drawnLineSegments,
  fillLabelPoint,
  fillPolygon,
  isHoveringGeometry,
  setIsHoveringGeometry,
}) => {
  const map = useContext(MapContext);

  const [isHoveringPolygonFill, setIsHoveringPolygonFill] = useState(false);
  const [isHoveringCircle, setIsHoveringCircle] = useState(false);

  useMapSource(SOURCE_IDS.FILL_SOURCE, fillPolygon, { type: 'geojson' });
  useMapSource(SOURCE_IDS.FILL_LABEL_SOURCE, fillLabelPoint, { type: 'geojson' });
  useMapSource(SOURCE_IDS.LINE_SOURCE, drawnLineSegments, { type: 'geojson' });
  useMapSource(SOURCE_IDS.POINT_SOURCE, drawnLinePoints, { generateId: true, type: 'geojson' });

  useMapLayer(LAYER_IDS.LINE_LABELS, 'symbol', SOURCE_IDS.LINE_SOURCE, symbolPaint, lineSymbolLayout, {
    condition: drawing || !isHoveringGeometry || draggedPoint,
  });
  useMapLayer(LAYER_IDS.FILL_LABEL, 'symbol', SOURCE_IDS.FILL_LABEL_SOURCE, symbolPaint, polygonSymbolLayout, {
    condition: drawing || !isHoveringGeometry || draggedPoint,
  });
  useMapLayer(LAYER_IDS.LINES, 'line', SOURCE_IDS.LINE_SOURCE, linePaint, lineLayout);
  const fillLayer = useMapLayer(LAYER_IDS.FILL, 'fill', SOURCE_IDS.FILL_SOURCE, fillPaint, fillLayout);
  const pointsLayer = useMapLayer(LAYER_IDS.POINTS, 'circle', SOURCE_IDS.POINT_SOURCE, circlePaint);

  const onCircleMouseEnter = useCallback((event) => {
    setIsHoveringCircle(true);

    const hoveredPoint = map.queryRenderedFeatures(event.point, { layers: [LAYER_IDS.POINTS] })
      .find((point) => point.properties.pointHover);
    if (hoveredPoint) {
      map.setFeatureState({ source: SOURCE_IDS.POINT_SOURCE, id: hoveredPoint.id }, { isHovering: true });
    }

    map.getCanvas().style.cursor = 'pointer';
  }, [map]);

  const onCircleMouseLeave = useCallback(() => {
    setIsHoveringCircle(false);

    map.queryRenderedFeatures({ layers: [LAYER_IDS.POINTS] })
      .filter((point) => point.properties.pointHover)
      .forEach((point) => map.setFeatureState(
        { source: SOURCE_IDS.POINT_SOURCE, id: point.id },
        { isHovering: false })
      );

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
