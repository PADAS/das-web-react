const metersPerPixel = (lat, zoom) => {
  var earthCircumference = 40075017;
  var latitudeRadians = lat * (Math.PI/180);
  return earthCircumference * Math.cos(latitudeRadians) / Math.pow(2, zoom + 8);
};

export const calcPixelsForMeters = function(meters, map) {
  const { lat } = map.getCenter();
  const zoom = map.getZoom();
  return meters / metersPerPixel(lat, zoom);
};