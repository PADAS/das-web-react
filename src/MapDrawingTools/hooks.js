import { useMemo } from 'react';
import along from '@turf/along';
import { featureCollection } from '@turf/helpers';
import isEqual from 'react-fast-compare';
import length from '@turf/length';
import { lineString } from '@turf/helpers';

import { DRAWING_MODES } from '.';
import { createLineSegmentGeoJsonForCoords, createFillPolygonForCoords } from './utils';

export const useDrawToolGeoJson = (
  points = [],
  drawing,
  cursorCoords = null,
  drawMode = DRAWING_MODES.POLYGON,
  polygonHover = false,
  draggedPoint = null
) => {
  // This calculates the array of coordinates of the vertices [[lng1, lat1], [lng2, lat2], ...]
  const vertexCoordinates = useMemo(() => {
    const vertexCoordinates = [...points];

    if (drawing && cursorCoords) {
      vertexCoordinates.push(cursorCoords);
    }

    if (draggedPoint) {
      vertexCoordinates.splice(draggedPoint.properties.midpointIndex + 1, 0, cursorCoords);
    }

    if (drawMode === DRAWING_MODES.POLYGON && vertexCoordinates.length > 2) {
      vertexCoordinates.push(points[0]);
    }

    return vertexCoordinates;
  }, [cursorCoords, draggedPoint, drawMode, drawing, points]);

  return useMemo(() => {
    const data = { drawnLineSegments: featureCollection([]), fillPolygon: featureCollection([]) };

    // Line segments feature
    if (vertexCoordinates.length >= 2) {
      data.drawnLineSegments = createLineSegmentGeoJsonForCoords(vertexCoordinates);
    };

    const shouldCalculatePolygonData = drawMode === DRAWING_MODES.POLYGON && vertexCoordinates.length > 2;

    // Polygon fill feature
    if (shouldCalculatePolygonData) {
      const fillPolygonCoords = [...vertexCoordinates];

      const isPolygonClosed = isEqual(vertexCoordinates[0], vertexCoordinates[vertexCoordinates.length - 1]);
      if (!isPolygonClosed) {
        fillPolygonCoords.push(vertexCoordinates[0]);
      }

      data.fillPolygon = createFillPolygonForCoords(fillPolygonCoords);
    }

    // Midpoints at the center of each polygon line
    if (shouldCalculatePolygonData && !drawing && !draggedPoint && polygonHover) {
      const drawnLineMidpointFeatures = vertexCoordinates.reduce((accumulator, coordinates, index) => {
        if (index !== vertexCoordinates.length - 1) {
          var line = lineString([coordinates, vertexCoordinates[index + 1]]);
          var lineLength = length(line);
          var midpoint = along(line, lineLength / 2);

          midpoint.properties = { midpointIndex: index, midpoint: true };

          return [...accumulator, midpoint];
        }
        return accumulator;
      }, []);

      data.drawnLineSegments = featureCollection([
        ...data.drawnLineSegments.features,
        ...featureCollection(drawnLineMidpointFeatures).features,
        ...featureCollection(drawnLineMidpointFeatures.map((midpoint) => ({
          ...midpoint,
          properties: { midpointCenter: true },
        }))).features,
      ]);
    }

    return data;
  }, [draggedPoint, drawMode, drawing, vertexCoordinates, polygonHover]);
};
