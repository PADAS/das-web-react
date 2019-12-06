import { metersPerPixel } from './map';

export const calcPixelsForMeters = function(meters, map) {
  const { lat } = map.getCenter();
  const zoom = map.getZoom();
  return meters / metersPerPixel(lat, zoom);
};