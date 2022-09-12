import { polygon } from '@turf/helpers';
import kinks from '@turf/kinks';

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
