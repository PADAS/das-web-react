import { area, polygon } from '@turf/turf';
import isEqual from 'react-fast-compare';

export const calcPolygonAreaDisplayString = (points) => {
  if (points.length < 3) return null;

  return `${(area(polygon([[...points, points[0]]])) / 1_000_000).toFixed(2)}km²`;
};

export const calcCursorPolygonAreaDisplayString = (points, cursorCoords) => {
  const lastPoint = points[points.length - 1];
  const ring = !!cursorCoords && !isEqual(cursorCoords, lastPoint)
    ? [...points, cursorCoords]
    : points;

  return calcPolygonAreaDisplayString(ring);
};
