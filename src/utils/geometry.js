
import { convertArea, convertLength, polygon } from '@turf/helpers';
import kinks from '@turf/kinks';
import area from '@turf/area';
import length from '@turf/length';

import { truncateFloatingNumber } from './math';

export const validateEventPolygonPoints = (points) => {
  let shape;

  // first see if turf accepts it as a polygon
  try {
    shape = polygon([points]);
  } catch (e) {
    return false;
  }

  // now ensure it doesn't kink
  return !kinks(shape)?.features?.length;
};

export const calcEventGeoMeasurementDisplayStrings = (eventGeo, geometryHasBeenEdited) => {
  const perimeterDisplayString = calculatePerimeterDisplayString(eventGeo, geometryHasBeenEdited);
  const areaDisplayString = calculateAreaDisplayString(eventGeo, geometryHasBeenEdited);

  return [perimeterDisplayString, areaDisplayString];
};

const calculateAreaDisplayString = (eventGeo, hasBeenEdited) => {
  if (!eventGeo) return `${0}`;

  let value = truncateFloatingNumber(
    convertArea(
      (hasBeenEdited
        ? area(eventGeo)
        : eventGeo?.features?.[0]?.properties?.area ?? 0),
      'meters',
      'kilometers',
    ),
    2,
  );

  if (hasBeenEdited) value = `~${value}`;

  return value;
};

const calculatePerimeterDisplayString = (eventGeo, hasBeenEdited) => {
  if (!eventGeo) return `${0}`;

  let value = truncateFloatingNumber(
    convertLength(
      (hasBeenEdited
        ? length(eventGeo)
        : eventGeo?.features?.[0]?.properties?.perimeter ?? 0),
      hasBeenEdited ? 'kilometers' : 'meters',
      'kilometers',
    ),
    2,
  );

  if (hasBeenEdited) value = `~${value}`;

  return value;
};
