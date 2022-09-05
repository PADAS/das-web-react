import area from '@turf/area';
import centroid from '@turf/centroid';
import { convertArea, featureCollection, lineString, point, polygon } from '@turf/helpers';
import length from '@turf/length';
import lineSegment from '@turf/line-segment';

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

export const createFillPolygonForCoords = (coords) => polygon([coords]);

export const createPointsGeoJsonForCoords = (coords) => {
  const points = coords.map((coordinates, index) => point(coordinates, { pointIndex: index }));

  return featureCollection(points);
};

export const createLabelPointForPolygon = (polygon) => {
  const polygonCentroid = centroid(polygon);
  const polygonArea = convertArea(area(polygon), 'meters', 'kilometers');
  const areaLabel = `${polygonArea.toFixed(2)}km²`;

  return  {
    ...polygonCentroid,
    properties: {
      ...polygonCentroid.properties,
      area: polygonArea,
      areaLabel,
    }
  };
};
