import { lineString, polygon } from '@turf/helpers';
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

  return lineSegments;
};

export const createFillPolygonForCoords = (coords) => polygon([coords]);
