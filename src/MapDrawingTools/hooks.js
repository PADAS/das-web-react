import { useMemo } from 'react';

import { DRAWING_MODES } from '.';
import { createLineSegmentGeoJsonForCoords, createFillPolygonForCoords } from './utils';

export const useDrawToolGeoJson = (points = [], cursorCoords = null, drawMode = DRAWING_MODES.POLYGON) => {
  const drawnLinePoints = useMemo(() =>
    cursorCoords
      ? [...points, cursorCoords]
      : [...points],
  [points, cursorCoords]);

  const shouldCalcPolygonData = drawMode === DRAWING_MODES.POLYGON && drawnLinePoints.length > 2;

  const fillPolygonPoints = useMemo(() =>
    shouldCalcPolygonData
      ? [...drawnLinePoints, drawnLinePoints.at(0)]
      : null, [drawnLinePoints, shouldCalcPolygonData]);

  const geoJsonObject = useMemo(() => {
    if (drawnLinePoints.length < 2) return null;

    const data = {
      drawnLineSegments: createLineSegmentGeoJsonForCoords(drawnLinePoints),
    };

    if (fillPolygonPoints) {
      data.fillPolygon = createFillPolygonForCoords(fillPolygonPoints);
    }

    return data;

  }, [drawnLinePoints, fillPolygonPoints]);

  return geoJsonObject;
};