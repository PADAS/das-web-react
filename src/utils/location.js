import Dms from 'geodesy/dms';
import Utm, { LatLon as LatLon_Utm } from 'geodesy/utm';
import Mgrs, { LatLon as Latlon_Utm_Mgrs } from 'geodesy/mgrs';
import LatLon from 'geodesy/latlon-ellipsoidal-vincenty';
import bearing from '@turf/bearing';

const LNG_LAT_DECIMAL_PRECISION = 6;


export const GPS_FORMATS = {
  DEG: 'DEG',
  DMS: 'DMS',
  DDM: 'DDM',
  UTM: 'UTM',
  MGRS: 'MGRS',
};

export const GPS_FORMAT_LABELS = {
  DDM: 'Degrees, Decimals, Minutes',
  DEG: 'Latitude, Longitude',
  DMS: 'Degrees, Minutes, Seconds',
  UTM: 'Universal Transverse Mercator',
  MGRS: 'Military Grid Reference System',
};

export const GPS_FORMAT_EXAMPLES = {
  DDM: '00° 09.1758′ S, 037° 18.5436′ E',
  DEG: ' -0.15293, 37.30906',
  DMS: '0 9′ 10.5624″ S, 37 18′ 32.6185″ E',
  UTM: '37 S 311814 9983089',
  MGRS: ' 37M CV 11813 83088',
};


const degToLngLat = (deg) => {
  const locationSplit = deg.split(',');
  const lat = locationSplit[0].trim();
  const lng = locationSplit[1].trim();
  return `${parseFloat(parseFloat(lng).toFixed(LNG_LAT_DECIMAL_PRECISION))}, ${parseFloat(parseFloat(lat).toFixed(LNG_LAT_DECIMAL_PRECISION))}`;
};

const dmsToLngLat = (dms) => {
  const locationSplit = dms.split(', ');
  const lat = Dms.parse(locationSplit[0]);
  const lng = Dms.parse(locationSplit[1]);
  return `${parseFloat(parseFloat(lng).toFixed(LNG_LAT_DECIMAL_PRECISION))}, ${parseFloat(parseFloat(lat).toFixed(LNG_LAT_DECIMAL_PRECISION))}`;
};

const ddmToLngLat = (ddm) => {
  const locationSplit = ddm.split(', ');
  const lat = Dms.parse(locationSplit[0]);
  const lng = Dms.parse(locationSplit[1]);
  return `${parseFloat(parseFloat(lng).toFixed(LNG_LAT_DECIMAL_PRECISION))}, ${parseFloat(parseFloat(lat).toFixed(LNG_LAT_DECIMAL_PRECISION))}`;
};

const utmToLngLat = (utm) => {
  if (typeof utm === 'string') {
    utm = Utm.parse(utm);
  }
  const latLon = utm.toLatLon();
  return `${latLon.lon}, ${latLon.lat}`;
};

const mgrsToLngLat = (mgrs) => {
  if (typeof mgrs === 'string') {
    mgrs = Mgrs.parse(mgrs);
  }
  const latLon = mgrs.toUtm().toLatLon();
  return `${latLon.lon}, ${latLon.lat}`;
};

const isLatitude = lat => isFinite(lat) && Math.abs(lat) <= 90;
const isLongitude = lng => isFinite(lng) && Math.abs(lng) <= 180;

const calcActualGpsObject = (lng, lat) => {
  return {
    latitude: lat,
    longitude: lng,
  };
};

const calcActualGpsPositionFromLngLatString = (lngLatString) => {
  if (lngLatString) {
    const locSplit = lngLatString.split(', ');
    if (locSplit && locSplit.length === 2) {
      return calcActualGpsObject(locSplit[0], locSplit[1]);
    }
  }
  return null;
};

export const calcGpsDisplayString = (lat, lng, gpsFormat) => {
  lat = Number(lat);
  lng = Number(lng);

  const position = new LatLon(lat, lng);

  if (position) {
    switch (gpsFormat) {
    case GPS_FORMATS.DEG:
      return position.toString('n', LNG_LAT_DECIMAL_PRECISION).split(',').map(item => item += '°').join(', ');

    case GPS_FORMATS.DMS:
      return position.toString('dms', LNG_LAT_DECIMAL_PRECISION);

    case GPS_FORMATS.DDM:
      return position.toString('dm', LNG_LAT_DECIMAL_PRECISION);

    case GPS_FORMATS.UTM:
      const posUtm = new LatLon_Utm(lat, lng).toUtm();
      return posUtm.toString();

    case GPS_FORMATS.MGRS:
      const posMgrs = new Latlon_Utm_Mgrs(lat, lng).toUtm().toMgrs();
      return posMgrs.toString();

    default:
      break;
    }
  }
  return '';
};

export const calcActualGpsPositionForRawText = (rawText, formatKey) => {
  let latLonString;

  if (formatKey === GPS_FORMATS.DEG) latLonString = degToLngLat(rawText);
  if (formatKey === GPS_FORMATS.DMS) latLonString = dmsToLngLat(rawText);
  if (formatKey === GPS_FORMATS.DDM) latLonString = ddmToLngLat(rawText);
  if (formatKey === GPS_FORMATS.UTM) latLonString = utmToLngLat(rawText);
  if (formatKey === GPS_FORMATS.MGRS) latLonString = mgrsToLngLat(rawText);

  return latLonString ? calcActualGpsPositionFromLngLatString(latLonString) : null;
};

export const validateLngLat = (lng, lat) => isLatitude(lat) && isLongitude(lng);

export const calcPositiveBearing = (point1, point2) => {
  const bearingMeasurement = bearing(point1, point2);
  if (bearingMeasurement >= 0) return bearingMeasurement;
  return (360 + bearingMeasurement);
};


export const calcLocationParamStringForUserLocationCoords = (coords) => `${coords.longitude},${coords.latitude}`;