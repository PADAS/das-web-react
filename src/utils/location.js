import { bearing } from '@turf/turf';
import Dms from 'geodesy/dms';
import Utm, { LatLon as LatLonUtm } from 'geodesy/utm';
import Mgrs, { LatLon as LatLonMgrs } from 'geodesy/mgrs';
import LatLon from 'geodesy/latlon-ellipsoidal-vincenty';

const LNG_LAT_DECIMAL_PRECISION = 6;

export const GPS_FORMATS = {
  DEG: 'DEG',
  DMS: 'DMS',
  DDM: 'DDM',
  UTM: 'UTM',
  MGRS: 'MGRS',
};

export const GPS_FORMAT_EXAMPLES = {
  DDM: '00° 09.1758′ S, 037° 18.5436′ E',
  DEG: ' -0.15293, 37.30906',
  DMS: '0 9′ 10.5624″ S, 37 18′ 32.6185″ E',
  UTM: '37 S 311814 9983089',
  MGRS: ' 37M CV 11813 83088',
};

const isValidLatitude = (latitude) => !Number.isNaN(latitude) && Math.abs(latitude) <= 90;

const isValidLongitude = (longitude) => !Number.isNaN(longitude) && Math.abs(longitude) <= 180;

const degToLngLat = (deg) => {
  if (typeof deg === 'string') {
    const degParts = deg.split(',').map((part) => part.trim());
    if (degParts.length === 2) {
      const latitude = Number(parseFloat(degParts[0]).toFixed(LNG_LAT_DECIMAL_PRECISION));
      const longitude = Number(parseFloat(degParts[1]).toFixed(LNG_LAT_DECIMAL_PRECISION));
      if (isValidLatitude(latitude) && isValidLongitude(longitude)) {
        return { latitude, longitude };
      }
    }
  }

  return null;
};

const dmsToLngLat = (dms) => {
  if (typeof dms === 'string') {
    const dmsParts = dms.split(',').map((part) => part.trim());
    if (dmsParts.length === 2) {
      const latitude = Number(parseFloat(Dms.parse(dmsParts[0])).toFixed(LNG_LAT_DECIMAL_PRECISION));
      const longitude = Number(parseFloat(Dms.parse(dmsParts[1])).toFixed(LNG_LAT_DECIMAL_PRECISION));
      if (isValidLatitude(latitude) && isValidLongitude(longitude)) {
        return { latitude, longitude };
      }
    }
  }

  return null;
};

const ddmToLngLat = (ddm) => {
  if (typeof ddm === 'string') {
    const ddmParts = ddm.split(',').map((part) => part.trim());
    if (ddmParts.length === 2) {
      const latitude = Number(parseFloat(Dms.parse(ddmParts[0])).toFixed(LNG_LAT_DECIMAL_PRECISION));
      const longitude = Number(parseFloat(Dms.parse(ddmParts[1])).toFixed(LNG_LAT_DECIMAL_PRECISION));
      if (isValidLatitude(latitude) && isValidLongitude(longitude)) {
        return { latitude, longitude };
      }
    }
  }

  return null;
};


const utmToLngLat = (utm) => {
  try {
    const latLon = Utm.parse(utm).toLatLon();
    const latitude = Number(latLon.lat.toFixed(LNG_LAT_DECIMAL_PRECISION));
    const longitude = Number(latLon.lon.toFixed(LNG_LAT_DECIMAL_PRECISION));
    if (isValidLatitude(latitude) && isValidLongitude(longitude)) {
      return { latitude, longitude };
    }
  } catch {}

  return null;
};

const mgrsToLngLat = (mgrs) => {
  try {
    const latLon = Mgrs.parse(mgrs).toUtm().toLatLon();
    const latitude = Number(latLon.lat.toFixed(LNG_LAT_DECIMAL_PRECISION));
    const longitude = Number(latLon.lon.toFixed(LNG_LAT_DECIMAL_PRECISION));
    if (isValidLatitude(latitude) && isValidLongitude(longitude)) {
      return { latitude, longitude };
    }
  } catch {}

  return null;
};

export const normalizeGpsFormatTextToLngLat = (rawText, gpsFormat) => {
  switch (gpsFormat) {
  case GPS_FORMATS.DEG:
    return degToLngLat(rawText);

  case GPS_FORMATS.DMS:
    return dmsToLngLat(rawText);

  case GPS_FORMATS.DDM:
    return ddmToLngLat(rawText);

  case GPS_FORMATS.UTM:
    return utmToLngLat(rawText);

  case GPS_FORMATS.MGRS:
    return mgrsToLngLat(rawText);

  default:
    return null;
  }
};

export const calcGpsDisplayString = (latitude, longitude, gpsFormat) => {
  const numericLatitude = Number(latitude);
  const numericLongitude = Number(longitude);

  if (isValidLatitude(numericLatitude) && isValidLongitude(numericLongitude)) {
    try {
      switch (gpsFormat) {
      case GPS_FORMATS.DEG:
        return new LatLon(numericLatitude, numericLongitude)
          .toString('n', LNG_LAT_DECIMAL_PRECISION)
          .split(',')
          .map(item => `${item.trim()}°`)
          .join(', ');

      case GPS_FORMATS.DMS:
        return new LatLon(numericLatitude, numericLongitude).toString('dms', LNG_LAT_DECIMAL_PRECISION);

      case GPS_FORMATS.DDM:
        return new LatLon(numericLatitude, numericLongitude).toString('dm', LNG_LAT_DECIMAL_PRECISION);

      case GPS_FORMATS.UTM:
        return new LatLonUtm(numericLatitude, numericLongitude).toUtm().toString();

      case GPS_FORMATS.MGRS:
        return new LatLonMgrs(numericLatitude, numericLongitude).toUtm().toMgrs().toString();

      default:
        return '';
      }
    } catch {}
  }

  return '';
};

export const validateLngLat = (longitude, latitude) => isValidLatitude(latitude) && isValidLongitude(longitude);

export const calcPositiveBearing = (point1, point2) => (bearing(point1, point2) + 360) % 360;

export const calcLocationParamStringForUserLocationCoords = (coords) => `${coords.longitude},${coords.latitude}`;

export const validateLocation = (location) => typeof location?.lng === 'number'
  && typeof location?.lat === 'number'
  && validateLngLat(location.lng, location.lat);

// epsg-index/all.json is 5mb. It's imported dynamically to keep it out of the
// app bundle and we store it in a singleton to only fetch it once.
let proj4CompatibleCRSSingleton = null;
export const getProj4CompatibleCRS = async () => {
  if (!proj4CompatibleCRSSingleton) {
    const { default: alCoordinateReferenceSystems } = await import('epsg-index/all.json');

    proj4CompatibleCRSSingleton = Object.values(alCoordinateReferenceSystems)
      .reduce((acc, coordinateReferenceSystem) => {
        // Only include coordinate reference systems that have proj4 in so they
        // can be transformed from one system to another.
        if (coordinateReferenceSystem.proj4) {
          acc.push({
            area: coordinateReferenceSystem.area,
            bbox: coordinateReferenceSystem.bbox,
            code: coordinateReferenceSystem.code,
            name: coordinateReferenceSystem.name,
            proj4: coordinateReferenceSystem.proj4,
          });
        }
        return acc;
      }, []);
  }

  return proj4CompatibleCRSSingleton;
};
