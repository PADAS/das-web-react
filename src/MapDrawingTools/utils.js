import area from '@turf/area';
import centerOfMass from '@turf/center-of-mass';
import { convertArea, featureCollection, lineString, point, polygon } from '@turf/helpers';
import length from '@turf/length';
import lineSegment from '@turf/line-segment';
import midpoint from '@turf/midpoint';

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
  const polygonArea = convertArea(area(polygon), 'meters', 'kilometers');
  const areaLabel = `${polygonArea.toFixed(2)}km²`;

  return  {
    ...polygonCenterOfMass,
    properties: {
      ...polygonCenterOfMass.properties,
      area: polygonArea,
      areaLabel,
    }
  };
};

export const createPointsGeoJsonForCoords = (coords, isDrawing) => {
  const points = coords.map((coordinates, index) => point(coordinates, { point: true, pointIndex: index }));

  if (isDrawing) {
    points.pop(); // Remove the point below the cursor

    points[0].properties = { ...points[0].properties, initialPoint: true };
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

  const midpointHovers = midpoints.map((midpoint) => ({ ...midpoint, properties: { pointHover: true } }));

  return featureCollection([ ...midpointHovers, ...midpoints ]);
};
