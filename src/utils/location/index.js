import { bboxPolygon, booleanPointInPolygon, point } from '@turf/turf';
import { bearing } from '@turf/turf';
import Dms from 'geodesy/dms';
import Utm, { LatLon as LatLonUtm } from 'geodesy/utm';
import Mgrs, { LatLon as LatLonMgrs } from 'geodesy/mgrs';
import LatLon from 'geodesy/latlon-ellipsoidal-vincenty';
import proj4 from 'proj4';

const PROJ4_REQUIRES_GRID_SHIFT_FILES_REGEX = /\+nadgrids=(?!@null)[^\s]+/;

const LOCATION_AXIS_DECIMAL_PRECISION = 6;

export const GPS_FORMATS = {
  DEG: 'DEG',
  DMS: 'DMS',
  DDM: 'DDM',
  UTM: 'UTM',
  MGRS: 'MGRS',
};

export const GPS_FORMAT_EXAMPLES = {
  DDM: '00° 09.1758′ S, 037° 18.5436′ E',
  DEG: '-0.15293, 37.30906',
  DMS: '0 9′ 10.5624″ S, 37 18′ 32.6185″ E',
  UTM: '37 S 311814 9983089',
  MGRS: '37M CV 11813 83088',
};

const isValidLatitude = (latitude) => !Number.isNaN(latitude) && Math.abs(latitude) <= 90;

const isValidLongitude = (longitude) => !Number.isNaN(longitude) && Math.abs(longitude) <= 180;

const degToLngLat = (degCoordinates) => {
  try {
    const degCoordinatesParts = degCoordinates.split(',').map((part) => part.trim());
    if (degCoordinatesParts.length === 2) {
      const latitude = Number(parseFloat(degCoordinatesParts[0]).toFixed(LOCATION_AXIS_DECIMAL_PRECISION));
      const longitude = Number(parseFloat(degCoordinatesParts[1]).toFixed(LOCATION_AXIS_DECIMAL_PRECISION));
      if (isValidLatitude(latitude) && isValidLongitude(longitude)) {
        return { latitude, longitude };
      }
    }
  } catch {}

  return null;
};

const dmsToLngLat = (dmsCoordinates) => {
  try {
    const dmsCoordinatesParts = dmsCoordinates.split(',').map((part) => part.trim());
    if (dmsCoordinatesParts.length === 2) {
      const latitude = Number(parseFloat(Dms.parse(dmsCoordinatesParts[0])).toFixed(LOCATION_AXIS_DECIMAL_PRECISION));
      const longitude = Number(parseFloat(Dms.parse(dmsCoordinatesParts[1])).toFixed(LOCATION_AXIS_DECIMAL_PRECISION));
      if (isValidLatitude(latitude) && isValidLongitude(longitude)) {
        return { latitude, longitude };
      }
    }
  } catch {}

  return null;
};

const ddmToLngLat = (ddmCoordinates) => {
  try {
    const ddmCoordinatesParts = ddmCoordinates.split(',').map((part) => part.trim());
    if (ddmCoordinatesParts.length === 2) {
      const latitude = Number(parseFloat(Dms.parse(ddmCoordinatesParts[0])).toFixed(LOCATION_AXIS_DECIMAL_PRECISION));
      const longitude = Number(parseFloat(Dms.parse(ddmCoordinatesParts[1])).toFixed(LOCATION_AXIS_DECIMAL_PRECISION));
      if (isValidLatitude(latitude) && isValidLongitude(longitude)) {
        return { latitude, longitude };
      }
    }
  } catch {}

  return null;
};

const utmToLngLat = (utmCoordinates) => {
  try {
    const { lat, lon } = Utm.parse(utmCoordinates).toLatLon();
    const latitude = Number(lat.toFixed(LOCATION_AXIS_DECIMAL_PRECISION));
    const longitude = Number(lon.toFixed(LOCATION_AXIS_DECIMAL_PRECISION));
    if (isValidLatitude(latitude) && isValidLongitude(longitude)) {
      return { latitude, longitude };
    }
  } catch {}

  return null;
};

const mgrsToLngLat = (mgrsCoordinates) => {
  try {
    const { lat, lon } = Mgrs.parse(mgrsCoordinates).toUtm().toLatLon();
    const latitude = Number(lat.toFixed(LOCATION_AXIS_DECIMAL_PRECISION));
    const longitude = Number(lon.toFixed(LOCATION_AXIS_DECIMAL_PRECISION));
    if (isValidLatitude(latitude) && isValidLongitude(longitude)) {
      return { latitude, longitude };
    }
  } catch {}

  return null;
};

const crsToLngLat = (crsCoordinates, crsProjection) => {
  try {
    const crsCoordinatesParts = crsCoordinates.split(',').map((part) => parseFloat(part.trim()));
    if (crsCoordinatesParts.length === 2) {
      const wgs84Coordinates = proj4(crsProjection, 'WGS84', crsCoordinatesParts);
      const latitude = Number(wgs84Coordinates[1].toFixed(LOCATION_AXIS_DECIMAL_PRECISION));
      const longitude = Number(wgs84Coordinates[0].toFixed(LOCATION_AXIS_DECIMAL_PRECISION));
      if (isValidLatitude(latitude) && isValidLongitude(longitude)) {
        return { latitude, longitude };
      }
    }
  } catch {}

  return null;
};

export const parseCoordinates = (coordinatesString, representation = GPS_FORMATS.DEG) => {
  if (typeof representation === 'string') {
    // If the coordinates representation is a string, the coordinates string
    // must come in one of our GPS formats.
    switch (representation) {
    case GPS_FORMATS.DEG:
      return degToLngLat(coordinatesString);

    case GPS_FORMATS.DMS:
      return dmsToLngLat(coordinatesString);

    case GPS_FORMATS.DDM:
      return ddmToLngLat(coordinatesString);

    case GPS_FORMATS.UTM:
      return utmToLngLat(coordinatesString);

    case GPS_FORMATS.MGRS:
      return mgrsToLngLat(coordinatesString);

    default:
      throw new Error(
        `Unsupported coordinates representation ${representation}: must be a known GPS format or a proj4 compatible coordinate reference system object`
      );
    }
  }

  if (representation?.proj4) {
    // If the coordinates representation is an object with a property proj4,
    // the coordinates string must come in a coordinate reference system
    // format.
    return crsToLngLat(coordinatesString, representation.proj4);
  }

  throw new Error(
    'Unsupported locationType: must be a known GPS format or a proj4 compatible coordinate reference system object'
  );
};

export const OUTSIDE_BBOX = 'OUTSIDE_BBOX';

export const stringifyCoordinates = (lngLat, representation = GPS_FORMATS.DEG) => {
  // First make sure that lngLat is an object with latitude and longitude
  // properties not being null or undefined
  if (lngLat?.latitude != null && lngLat?.longitude != null) {
    const numericLatitude = Number(lngLat.latitude);
    const numericLongitude = Number(lngLat.longitude);

    if (isValidLatitude(numericLatitude) && isValidLongitude(numericLongitude)) {
      try {
        if (representation?.proj4) {
          // If the coordinates representation is an object with a property
          // proj4, the location must be transformed to a coordinate reference
          // system format.
          if (representation.bbox) {
            const coordinateReferenceSystemBboxPolygon = bboxPolygon(representation.bbox);
            const locationPoint = point([numericLongitude, numericLatitude]);
            const isLocationInsideCrsBbox = booleanPointInPolygon(locationPoint, coordinateReferenceSystemBboxPolygon);
            if (!isLocationInsideCrsBbox) {
              return OUTSIDE_BBOX;
            }
          }

          const crsCoordinates = proj4('WGS84', representation.proj4, [numericLongitude, numericLatitude]);
          const x = Number(crsCoordinates[0].toFixed(LOCATION_AXIS_DECIMAL_PRECISION));
          const y = Number(crsCoordinates[1].toFixed(LOCATION_AXIS_DECIMAL_PRECISION));
          return `${x}, ${y}`;
        }

        // Otherwise, the coordinates representation type must be one of our
        // GPS formats.
        switch (representation) {
        case GPS_FORMATS.DEG:
          return new LatLon(numericLatitude, numericLongitude)
            .toString('n', LOCATION_AXIS_DECIMAL_PRECISION)
            .split(',')
            .map(item => `${item.trim()}°`)
            .join(', ');

        case GPS_FORMATS.DMS:
          return new LatLon(numericLatitude, numericLongitude).toString('dms', LOCATION_AXIS_DECIMAL_PRECISION);

        case GPS_FORMATS.DDM:
          return new LatLon(numericLatitude, numericLongitude).toString('dm', LOCATION_AXIS_DECIMAL_PRECISION);

        case GPS_FORMATS.UTM:
          return new LatLonUtm(numericLatitude, numericLongitude).toUtm().toString();

        case GPS_FORMATS.MGRS:
          return new LatLonMgrs(numericLatitude, numericLongitude).toUtm().toMgrs().toString();

        default:
          return '';
        }
      } catch {}
    }
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
    const { default: allCoordinateReferenceSystems } = await import('epsg-index/all.json');

    proj4CompatibleCRSSingleton = Object.values(allCoordinateReferenceSystems)
      .reduce((acc, coordinateReferenceSystem) => {
        const needsGridShiftFile = PROJ4_REQUIRES_GRID_SHIFT_FILES_REGEX.test(coordinateReferenceSystem.proj4);

        // Only include coordinate reference systems that have proj4 strings
        // and that do not require grid shift files so they can be transformed
        // by the proj4 library.
        if (coordinateReferenceSystem.proj4 && !needsGridShiftFile) {
          let bbox = coordinateReferenceSystem.bbox;
          if (Array.isArray(bbox) && bbox.length === 4) {
            // If the coordinate reference system has a bbox, reorder its parts
            // to the format expected by Turf utilities.
            const [maxLat, minLng, minLat, maxLng] = bbox;
            bbox = [minLng, minLat, maxLng, maxLat];
          }

          acc.push({
            area: coordinateReferenceSystem.area,
            bbox,
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
