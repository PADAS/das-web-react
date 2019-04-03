import Dms from 'geodesy/dms';
import Utm from 'geodesy/utm';
import Mgrs from 'geodesy/mgrs';
import LatLon from 'geodesy/latlon-ellipsoidal';

export const GPS_FORMATS = {
  DEG: 'DEG',
  DMS: 'DMS',
  UTM: 'UTM',
  MGRS: 'MGRS',
};

window.LatLon = LatLon;

const degToLatLon = (deg) => {
  const locationSplit = deg.split(',');
  const lat = locationSplit[0].trim();
  const lon = locationSplit[1].trim();
  return `${parseFloat(lat).toFixed(5)}, ${parseFloat(lon).toFixed(5)}`;
};

const dmsToLatLon = (dms) => {
  const locationSplit = dms.split(', ');
  const lat = Dms.parse(locationSplit[0]);
  const lon = Dms.parse(locationSplit[1]);
  return `${parseFloat(lat).toFixed(5)}, ${parseFloat(lon).toFixed(5)}`;
};

const utmToLatLon = (utm) => {
  if (typeof utm === 'string') {
    utm = Utm.parse(utm);
  }
  const latLon = utm.toLatLon();
  return `${latLon.lat}, ${latLon.lon}`;
};

const mgrsToLatLon = (mgrs) => {
  if (typeof mgrs === 'string') {
    mgrs = Mgrs.parse(mgrs);
  }
  const latLon = mgrs.toUtm().toLatLon;
  return `${latLon.lat}, ${latLon.lon}`;
};

const isLatitude = lat => isFinite(lat) && Math.abs(lat) <= 90;
const isLongitude = lng => isFinite(lng) && Math.abs(lng) <= 180;

const calcGpsDisplayFloat = v => `${v.toFixed(5).replace(/\.?0*$/, '')}°`;

export const calcGpsDisplayString = (lat, lon, gpsFormat) => {
  if (!isNaN(lat) && !isNaN(lon)) {
    lat = Number(lat);
    lon = Number(lon);

    const position = new LatLon(lat, lon);

    if (position) {
      switch (gpsFormat) {
        case GPS_FORMATS.DEG:
          return `${calcGpsDisplayFloat(lat)}, ${calcGpsDisplayFloat(lon)}`;

        case GPS_FORMATS.DMS:
          return position.toString('dms', 4);

        case GPS_FORMATS.UTM:
          return position.toUtm().toString();

        case GPS_FORMATS.MGRS:
          return position.toUtm().toMgrs().toString();

        default:
          break;
      }
    }
  }
  return null;
};

export const calcActualGpsPositionForRawText = (rawText, formatKey) => {
  let latLonString;

    if (formatKey === GPS_FORMATS.DEG) latLonString = degToLatLon(rawText);
    if (formatKey === GPS_FORMATS.DMS) latLonString = dmsToLatLon(rawText);
    if (formatKey === GPS_FORMATS.UTM) latLonString = utmToLatLon(rawText);
    if (formatKey === GPS_FORMATS.MGRS) latLonString = mgrsToLatLon(rawText);

    return latLonString ? this.calcActualGpsPositionFromLatLonString(latLonString) : null;
}

export const validateLatLon = (lat, lon) => isLatitude(lat) && isLongitude(lon);