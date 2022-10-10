
import isEqual from 'react-fast-compare';

import { convertArea, convertLength, polygon } from '@turf/helpers';
import kinks from '@turf/kinks';
import area from '@turf/area';
import length from '@turf/length';

import { truncateFloatingNumber } from './math';

const UNIT_LABELS = {
  'meters': 'm',
  'kilometers': 'km',
};

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

export const calcEventGeoMeasurementDisplayStrings = (event, originalEvent) => {
  const getComparisonCoords = eventObj =>
    eventObj?.geometry?.features?.[0]?.geometry?.coordinates
    || eventObj?.geometry?.geometry?.coordinates;

  const eventGeoCoords = getComparisonCoords(event);
  const originalEventGeoCoords = getComparisonCoords(originalEvent);

  const geometryHasBeenEdited = !isEqual(eventGeoCoords, originalEventGeoCoords);

  const eventGeo = event?.geometry;
  const originalEventGeo = originalEvent?.geometry;

  const perimeterDisplayString = calculatePerimeterDisplayString(eventGeo, originalEventGeo, geometryHasBeenEdited);
  const areaDisplayString = calculateAreaDisplayString(eventGeo, originalEventGeo, geometryHasBeenEdited);

  return [perimeterDisplayString, areaDisplayString];
};

const calculateAreaDisplayString = (eventGeo, originalEventGeo, hasBeenEdited) => {
  let value, unit = 'meters';

  if (!hasBeenEdited) {
    if (!originalEventGeo) return `${0}km²`;
    value = originalEventGeo?.features?.[0]?.properties?.area
      ?? originalEventGeo?.properties?.area;
  }

  if (!value) {
    if (!eventGeo) return `${0}km²`;

    value = area(eventGeo) * 1000;
  }

  if (value > 10000) {
    unit = 'kilometers';
  }

  value = truncateFloatingNumber(
    convertArea(
      value,
      'meters',
      unit,
    ),
    2,
  );

  if (hasBeenEdited) value = `~${value}`;

  return `${value}${UNIT_LABELS[unit]}²`;
};

const calculatePerimeterDisplayString = (eventGeo, originalEventGeo, hasBeenEdited) => {
  let value, unit = 'meters';

  if (!hasBeenEdited) {
    if (!originalEventGeo) return `${0}km`;

    value = originalEventGeo?.features?.[0]?.properties?.perimeter
    ?? originalEventGeo?.properties?.perimeter;
  }

  if (!value) {
    if (!eventGeo) return `${0}km`;

    value = length(eventGeo) * 1000;
  }

  if (value > 100) {
    unit = 'kilometers';
  }

  value = truncateFloatingNumber(
    convertLength(
      value,
      'meters',
      unit,
    ),
    2,
  );

  if (hasBeenEdited) value = `~${value}`;

  return `${value}${UNIT_LABELS[unit]}`;
};
