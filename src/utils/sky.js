
import SunCalc from 'suncalc';

export const updateSunPosition = (map, sunPos) => {
  map.setPaintProperty('sky', 'sky-atmosphere-sun', sunPos);
};


export const getSunPosition = (map, date) => {
  const { lat, lng } = map.getCenter();

  const sunPos = SunCalc.getPosition(
    date ? new Date(date) : new Date(),
    lat,
    lng
  );
  const sunAzimuth = 180 + (sunPos.azimuth * 180) / Math.PI;
  const sunAltitude = 90 - (sunPos.altitude * 180) / Math.PI;
  return [sunAzimuth, sunAltitude];
};
