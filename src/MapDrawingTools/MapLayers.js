import React, { memo, useCallback, useContext, useEffect, useState } from 'react';
import { MapContext } from '../App';

import { useMapEventBinding } from '../hooks';
import useMapSource from '../hooks/useMapSource';

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
import useMapLayer from '../hooks/useMapLayer';

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
  setIsHoveringMidpoint,
}) => {
  const map = useContext(MapContext);

  const [isHoveringPolygonFill, setIsHoveringPolygonFill] = useState(false);
  const [isHoveringCircle, setIsHoveringCircle] = useState(false);

  useMapSource({ id: SOURCE_IDS.FILL_SOURCE, data: fillPolygon }, { type: 'geojson' });
  useMapSource({ id: SOURCE_IDS.FILL_LABEL_SOURCE, data: fillLabelPoint }, { type: 'geojson' });
  useMapSource({ id: SOURCE_IDS.LINE_SOURCE, data: drawnLineSegments }, { type: 'geojson' });
  useMapSource({ id: SOURCE_IDS.POINT_SOURCE, data: drawnLinePoints }, { generateId: true, type: 'geojson' });

  useMapLayer(
    {
      id: LAYER_IDS.LINE_LABELS,
      type: 'symbol',
      sourceId: SOURCE_IDS.LINE_SOURCE,
      paint: symbolPaint,
      layout: lineSymbolLayout,
      options: {
        condition: drawing || !isHoveringGeometry || draggedPoint
      }
    }
  );
  useMapLayer(
    {
      id: LAYER_IDS.FILL_LABEL,
      type: 'symbol',
      sourceId: SOURCE_IDS.FILL_LABEL_SOURCE,
      paint: symbolPaint,
      layout: polygonSymbolLayout,
      options: {
        condition: drawing || !isHoveringGeometry || draggedPoint
      }
    }
  );

  useMapLayer(
    {
      id: LAYER_IDS.LINES,
      type: 'line',
      sourceId: SOURCE_IDS.LINE_SOURCE,
      paint: linePaint,
      layout: lineLayout
    }
  );

  const [fillLayer] = useMapLayer(
    {
      id: LAYER_IDS.FILL,
      type: 'fill',
      sourceId: SOURCE_IDS.FILL_SOURCE,
      paint: fillPaint,
      layout: fillLayout
    }
  );

  const [pointsLayer] = useMapLayer(
    {
      id: LAYER_IDS.POINTS,
      type: 'circle',
      sourceId: SOURCE_IDS.POINT_SOURCE,
      paint: circlePaint
    }
  );

  const onCircleMouseEnter = useCallback((event) => {
    setIsHoveringCircle(true);

    const hoveredPoint = map.queryRenderedFeatures(event.point, { layers: [LAYER_IDS.POINTS] })
      .find((point) => point.properties.pointHover || point.properties.midpointHover);
    if (hoveredPoint) {
      map.setFeatureState({ source: SOURCE_IDS.POINT_SOURCE, id: hoveredPoint.id }, { isHovering: true });
    }

    if (hoveredPoint.properties.midpointHover) {
      setIsHoveringMidpoint(true);
    }

    map.getCanvas().style.cursor = 'pointer';
  }, [map, setIsHoveringMidpoint]);

  const onCircleMouseLeave = useCallback(() => {
    setIsHoveringCircle(false);
    setIsHoveringMidpoint(false);

    map.queryRenderedFeatures({ layers: [LAYER_IDS.POINTS] })
      .filter((point) => point.properties.pointHover || point.properties.midpointHover)
      .forEach((point) => map.setFeatureState(
        { source: SOURCE_IDS.POINT_SOURCE, id: point.id },
        { isHovering: false })
      );

    map.getCanvas().style.cursor = '';
  }, [map, setIsHoveringMidpoint]);

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
