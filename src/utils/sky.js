
import * as SunCalc from 'suncalc';

export const updateSunPosition = (map, sunPos) => {
  map.setPaintProperty('sky', 'sky-atmosphere-sun', sunPos);
};


export const getSunPosition = (map, date) => {
  const { lat, lng } = map.getCenter();

  const sunPos = SunCalc.getPosition(date ? new Date(date) : new Date(), lat, lng);

  // Mapbox's polar angle is 0 at zenith/90 at horizon, the inverse of
  // suncalc's altitude.
  const sunAltitude = 90 - sunPos.altitude;
  return [sunPos.azimuth, sunAltitude];
};
