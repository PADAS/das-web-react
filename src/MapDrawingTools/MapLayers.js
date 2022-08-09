import React, { memo, useContext, useEffect } from 'react';
import { MapContext } from '../App';

import { useMapLayer, useMapSource } from '../hooks';

import { linePaint, lineLayout, circlePaint, fillLayout, fillPaint, symbolPaint, symbolLayout } from './layerStyles';

export const RULER_POINTS_LAYER_ID = 'RULER_POINTS_LAYER_ID';

export const LAYER_IDS = {
  POINTS: 'draw-layer-points',
  LINES: 'draw-layer-lines',
  LABELS: 'draw-layer-labels',
  FILL: 'draw-layer-fill',
};

const SOURCE_IDS = {
  LINE_SOURCE: 'map-line-source',
  FILL_SOURCE: 'map-fill-source',
};

const MapDrawingLayers = (props) => {
  const {
    data,
  } = props;

  const map = useContext(MapContext);

  useMapSource(SOURCE_IDS.LINE_SOURCE, data?.drawnLineSegments, { type: 'geojson' });
  useMapSource(SOURCE_IDS.FILL_SOURCE, data?.fillPolygon, { type: 'geojson' });


  useMapLayer(LAYER_IDS.LINES, 'line', SOURCE_IDS.LINE_SOURCE, linePaint, lineLayout);
  useMapLayer(LAYER_IDS.LABELS, 'symbol', SOURCE_IDS.LINE_SOURCE, symbolPaint, symbolLayout);
  useMapLayer(LAYER_IDS.FILL, 'fill', SOURCE_IDS.FILL_SOURCE, fillPaint, fillLayout);
  const circleLayer = useMapLayer(LAYER_IDS.POINTS, 'circle', SOURCE_IDS.LINE_SOURCE, circlePaint);

  useEffect(() => {
    if (map && circleLayer) {
      const onCircleMouseEnter = () => map.getCanvas().style.cursor = 'pointer';
      const onCircleMouseLeave = () => map.getCanvas().style.cursor = '';

      map.on('mouseenter', LAYER_IDS.POINTS, onCircleMouseEnter);
      map.on('mouseleave', LAYER_IDS.POINTS, onCircleMouseLeave);

      return () => {
        map.off('mouseenter', LAYER_IDS.POINTS, onCircleMouseEnter);
        map.off('mouseleave', LAYER_IDS.POINTS, onCircleMouseLeave);
      };
    }
  }, [circleLayer, map]);

  return null;
};

export default memo(MapDrawingLayers);
