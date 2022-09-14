import { useContext, useEffect, useMemo, useRef } from 'react';
import { featureCollection } from '@turf/helpers';
import isEqual from 'react-fast-compare';
import throttle from 'lodash/throttle';

import {
  createFillPolygonGeoJsonForCoords,
  createLabelPointGeoJsonForPolygon,
  createLineSegmentGeoJsonForCoords,
  createMidpointsGeoJsonForCoords,
  createPointsGeoJsonForCoords,
} from './utils';
import { DRAWING_MODES } from '.';
import { MapDrawingToolsContext } from './ContextProvider';

const POLYGON_AREA_CALCULATION_THROTLE_TIME = 150;
const MAP_DRAWING_DATA_UPDATE_THROTLE_TIME = 150;
const POINTS_IN_A_LINE = 2;

const createLabelPointGeoJsonForPolygonThrottled = throttle(
  createLabelPointGeoJsonForPolygon,
  POLYGON_AREA_CALCULATION_THROTLE_TIME
);

export const useDrawToolGeoJson = (
  points = [],
  isDrawing,
  cursorCoords = null,
  drawMode = DRAWING_MODES.POLYGON,
  polygonHover = false,
  draggedPoint = null
) => {
  const { setMapDrawingData } = useContext(MapDrawingToolsContext);

  const vertexCoordinates = useMemo(() => {
    const vertexCoordinates = [...points];

    if (isDrawing && cursorCoords) {
      vertexCoordinates.push(cursorCoords);
    }

    if (draggedPoint) {
      if (draggedPoint.properties.midpoint) {
        vertexCoordinates.splice(draggedPoint.properties.midpointIndex + 1, 0, cursorCoords);
      } else {
        vertexCoordinates[draggedPoint.properties.pointIndex] = cursorCoords;
      }
    }

    if (!isDrawing && drawMode === DRAWING_MODES.POLYGON && vertexCoordinates.length > POINTS_IN_A_LINE) {
      vertexCoordinates.push(vertexCoordinates[0]);
    }

    return vertexCoordinates;
  }, [cursorCoords, draggedPoint, drawMode, isDrawing, points]);

  const geoJson = useMemo(() => {
    const data = {
      drawnLinePoints: featureCollection([]),
      drawnLineSegments: featureCollection([]),
      fillLabelPoint: featureCollection([]),
      fillPolygon: featureCollection([]),
    };

    const shouldCalculateLinesData = vertexCoordinates.length >= POINTS_IN_A_LINE;
    const shouldCalculatePolygonData = drawMode === DRAWING_MODES.POLYGON
      && vertexCoordinates.length > POINTS_IN_A_LINE;
    const shouldCalculateMidpointsData = shouldCalculatePolygonData && !isDrawing && !draggedPoint && polygonHover;

    const isPolygonClosed = shouldCalculatePolygonData
      && isEqual(vertexCoordinates[0], vertexCoordinates[vertexCoordinates.length - 1]);

    if (shouldCalculateLinesData) {
      data.drawnLineSegments = createLineSegmentGeoJsonForCoords(vertexCoordinates);
      data.drawnLinePoints = createPointsGeoJsonForCoords(
        isPolygonClosed ? vertexCoordinates.slice(0, -1) : vertexCoordinates,
        isDrawing
      );
    };

    if (shouldCalculatePolygonData) {
      const fillPolygonCoords = [...vertexCoordinates];

      if (!isPolygonClosed) {
        fillPolygonCoords.push(vertexCoordinates[0]);
      }

      data.fillPolygon = createFillPolygonGeoJsonForCoords(fillPolygonCoords);
      data.fillLabelPoint = createLabelPointGeoJsonForPolygonThrottled(data.fillPolygon);
    }

    if (shouldCalculateMidpointsData) {
      data.drawnLinePoints = featureCollection([
        ...data.drawnLinePoints.features,
        ...createMidpointsGeoJsonForCoords(vertexCoordinates).features,
      ]);
    }

    return data;
  }, [draggedPoint, drawMode, isDrawing, vertexCoordinates, polygonHover]);

  const setMapDrawingDataThrottledRef = useRef(throttle((newGeoJson) => {
    setMapDrawingData(newGeoJson);
  }, MAP_DRAWING_DATA_UPDATE_THROTLE_TIME));

  useEffect(() => {
    setMapDrawingDataThrottledRef.current(geoJson);
  }, [geoJson]);

  return geoJson;
};
