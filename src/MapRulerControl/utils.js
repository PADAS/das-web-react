import { area, kinks, polygon } from '@turf/turf';

import { convertAreaForDisplay } from '../utils/geometry';
import { getClosedRingCoords } from '../MapDrawingTools/utils';

const DEGREES_IN_A_CIRCLE = 360;
const HALF_CIRCLE_DEGREES = 180;

// turf measures a ring in raw longitude space, so one straddling the antimeridian
// would otherwise be measured the long way around the globe. Returns null for a ring
// that wraps the globe, whose interior is ambiguous whichever way it is measured.
const unwrapAntimeridian = (ring) => {
  const unwrapped = ring.slice(0, -1).reduce((coords, [lng, lat], index) => {
    if (!index) return [[lng, lat]];

    const drift = lng - coords[index - 1][0];
    const crossesAntimeridian = Math.abs(drift) > HALF_CIRCLE_DEGREES;

    return [...coords, [crossesAntimeridian ? lng - Math.sign(drift) * DEGREES_IN_A_CIRCLE : lng, lat]];
  }, []);

  const closingDrift = unwrapped[0][0] - unwrapped[unwrapped.length - 1][0];

  return Math.abs(closingDrift) > HALF_CIRCLE_DEGREES ? null : [...unwrapped, unwrapped[0]];
};

export const calcPolygonAreaDisplayString = (points) => {
  const ring = getClosedRingCoords(points);

  if (!ring) return null;

  const unwrappedRing = unwrapAntimeridian(ring);

  if (!unwrappedRing) return null;

  const measuredPolygon = polygon([unwrappedRing]);

  // turf cancels a self-crossing ring towards zero, so report no area rather than a wrong one
  if (kinks(measuredPolygon).features.length) return null;

  return convertAreaForDisplay(area(measuredPolygon)).displayString;
};

export const calcCursorPolygonAreaDisplayString = (points, cursorCoords) =>
  calcPolygonAreaDisplayString(cursorCoords ? [...points, cursorCoords] : points);
