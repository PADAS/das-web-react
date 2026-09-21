import {
  area,
  centerOfMass,
  featureCollection,
  length,
  lineSegment,
  lineString,
  midpoint,
  point,
  polygon,
} from '@turf/turf';
import isEqual from 'react-fast-compare';

import { convertAreaForDisplay } from '../utils/geometry';

const MIN_RING_VERTICES = 3;

export const createLineSegmentGeoJsonForCoords = (coords) => {
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

  lineSegments.properties = { lengthLabel: `${length(lineSegments).toFixed(2)}km` };

  return lineSegments;
};

export const createFillPolygonGeoJsonForCoords = (coords) => polygon([coords]);

export const createLabelPointGeoJsonForPolygon = (polygon) => {
  const polygonCenterOfMass = centerOfMass(polygon);
  const { displayString, value } = convertAreaForDisplay(area(polygon));

  return  {
    ...polygonCenterOfMass,
    properties: {
      ...polygonCenterOfMass.properties,
      area: value,
      areaLabel: displayString,
    }
  };
};

const getDistinctCoords = (coords) =>
  coords.filter((coordinates, index) => index === 0 || !isEqual(coordinates, coords[index - 1]));

// Returns null rather than a degenerate ring, so callers share one gate on whether an area exists at all.
export const getClosedRingCoords = (coords) => {
  const vertices = getDistinctCoords(coords);
  const openRing = vertices.length > 1 && isEqual(vertices[0], vertices[vertices.length - 1])
    ? vertices.slice(0, -1)
    : vertices;

  return openRing.length < MIN_RING_VERTICES ? null : [...openRing, openRing[0]];
};

export const createPointsGeoJsonForCoords = (coords, isDrawing, isMediumLayoutOrLarger) => {
  const points = coords.map((coordinates, index) => point(coordinates, { point: true, pointIndex: index }));

  if (isDrawing) {
    if (isMediumLayoutOrLarger) {
      points.pop(); // Remove the point below the cursor
    }

    if (points.length) {
      points[0].properties = { ...points[0].properties, initialPoint: true };
    }
  }

  const pointHovers = points.map((point) => ({ ...point, properties: { pointHover: true } }));

  return featureCollection([ ...pointHovers, ...points ]);
};

export const createMidpointsGeoJsonForCoords = (coords) => {
  const midpoints = coords.reduce((accumulator, coordinates, index) => {
    if (index !== coords.length - 1) {
      const midpointFeature = midpoint(coordinates, coords[index + 1]);
      midpointFeature.properties = { midpoint: true, midpointIndex: index };

      return [...accumulator, midpointFeature];
    }
    return accumulator;
  }, []);

  const midpointHovers = midpoints.map((midpoint) => ({ ...midpoint, properties: { midpointHover: true } }));

  return featureCollection([ ...midpointHovers, ...midpoints ]);
};
