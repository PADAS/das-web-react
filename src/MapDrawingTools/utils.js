import { useMemo } from 'react';
import { lineString, polygon } from '@turf/helpers';
import length from '@turf/length';
import lineSegment from '@turf/line-segment';

import { DRAWING_MODES } from './';

const createLineSegmentGeoJsonForCoords = (coords) => {
  const lineSegments = lineSegment(lineString(coords));

  lineSegments.features = lineSegments.features.map(feature => {
    const lineLength = length(feature);
    const lengthLabel = `${lineLength.toFixed(2)}km`;

    return {
      ...feature,
      properties: {
        ...feature.properties,
        length: lineLength,
        lengthLabel,
      }
    };
  });

  return lineSegments;
};

const createFillPolygonForCoords = (coords) => polygon([coords]);

export const calcDrawToolGeoJsonFromPoints = (points, cursorCoords = null, drawMode = DRAWING_MODES.POLYGON) => {
  let drawnLinePoints = points;
  let autoCompleteLinePoints;
  let fillPolygonPoints;

  if (cursorCoords) {
    drawnLinePoints = [...drawnLinePoints, cursorCoords];
  }

  if (drawnLinePoints.length < 2) return null;

  const shouldPresentPolygonData = drawMode === DRAWING_MODES.POLYGON && drawnLinePoints.length > 2;

  if (shouldPresentPolygonData) {
    fillPolygonPoints = [...drawnLinePoints, drawnLinePoints.at(0)];
    autoCompleteLinePoints = [drawnLinePoints.at(0), drawnLinePoints.at(-1)];
  }

  const data = {
    lineSegments: createLineSegmentGeoJsonForCoords(drawnLinePoints),
  };

  if (shouldPresentPolygonData) {
    data.autoCompleteLine = createLineSegmentGeoJsonForCoords(autoCompleteLinePoints);
    data.fillPolygon = createFillPolygonForCoords(fillPolygonPoints);
  }

  return data;
};

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

  const autoCompleteLinePoints = useMemo(() =>
    shouldCalcPolygonData
      ? [drawnLinePoints.at(0), drawnLinePoints.at(-1)]
      : null
  , [drawnLinePoints, shouldCalcPolygonData]);

  const geoJsonObject = useMemo(() => {
    if (drawnLinePoints.length < 2) return null;

    const data = {
      drawnLineSegments: createLineSegmentGeoJsonForCoords(drawnLinePoints),
    };

    if (autoCompleteLinePoints) {
      data.autoCompleteLine = createLineSegmentGeoJsonForCoords(autoCompleteLinePoints);
    }

    if (fillPolygonPoints) {
      data.fillPolygon = createFillPolygonForCoords(fillPolygonPoints);
    }

    return data;

  }, [autoCompleteLinePoints, drawnLinePoints, fillPolygonPoints]);

  return geoJsonObject;
};