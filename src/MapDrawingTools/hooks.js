import { useMemo } from 'react';
import { featureCollection } from '@turf/helpers';
import isEqual from 'react-fast-compare';
import midpoint from '@turf/midpoint';

import { DRAWING_MODES } from '.';
import { createLineSegmentGeoJsonForCoords, createFillPolygonForCoords, createPointsGeoJsonForCoords } from './utils';

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
      if (draggedPoint.properties.midpoint) {
        vertexCoordinates.splice(draggedPoint.properties.midpointIndex + 1, 0, cursorCoords);
      } else {
        vertexCoordinates[draggedPoint.properties.pointIndex] = cursorCoords;
      }
    }

    if (!drawing && drawMode === DRAWING_MODES.POLYGON && vertexCoordinates.length > 2) {
      vertexCoordinates.push(vertexCoordinates[0]);
    }

    return vertexCoordinates;
  }, [cursorCoords, draggedPoint, drawMode, drawing, points]);

  return useMemo(() => {
    const data = {
      drawnLinePoints: featureCollection([]),
      drawnLineSegments: featureCollection([]),
      fillPolygon: featureCollection([]),
    };

    const shouldCalculateLinesData = vertexCoordinates.length >= 2;
    const shouldCalculatePolygonData = drawMode === DRAWING_MODES.POLYGON && vertexCoordinates.length > 2;

    const isPolygonClosed = shouldCalculatePolygonData
      && isEqual(vertexCoordinates[0], vertexCoordinates[vertexCoordinates.length - 1]);

    // Line segments and vertex points
    if (shouldCalculateLinesData) {
      data.drawnLineSegments = createLineSegmentGeoJsonForCoords(vertexCoordinates);
      data.drawnLinePoints = createPointsGeoJsonForCoords(isPolygonClosed
        ? vertexCoordinates.slice(0, -1)
        : vertexCoordinates);
    };

    // Polygon fill
    if (shouldCalculatePolygonData) {
      const fillPolygonCoords = [...vertexCoordinates];

      if (!isPolygonClosed) {
        fillPolygonCoords.push(vertexCoordinates[0]);
      }

      data.fillPolygon = createFillPolygonForCoords(fillPolygonCoords);
    }

    // Points at the middle of each polygon line
    const shouldRenderMidpoints = shouldCalculatePolygonData && !drawing && !draggedPoint && polygonHover;
    if (shouldRenderMidpoints) {
      const drawnLineMidpointFeatures = vertexCoordinates.reduce((accumulator, coordinates, index) => {
        if (index !== vertexCoordinates.length - 1) {
          const midpointFeature = midpoint(coordinates, vertexCoordinates[index + 1]);
          midpointFeature.properties = { midpointIndex: index, midpoint: true };

          return [...accumulator, midpointFeature];
        }
        return accumulator;
      }, []);

      const midpointCenters = drawnLineMidpointFeatures.map((midpoint) => ({
        ...midpoint,
        properties: { midpointCenter: true },
      }));

      data.drawnLinePoints = featureCollection([
        ...data.drawnLinePoints.features,
        ...featureCollection(drawnLineMidpointFeatures).features,
        ...featureCollection(midpointCenters).features,
      ]);
    }

    return data;
  }, [draggedPoint, drawMode, drawing, vertexCoordinates, polygonHover]);
};
