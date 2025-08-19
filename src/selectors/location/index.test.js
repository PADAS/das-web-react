import { epsg2154, epsg2946, epsg3857, epsg4269, epsg5367 } from '../../__test-helpers/fixtures/location';
import { GPS_FORMATS } from '../../utils/location';

import { selectCoordinatesRepresentation, selectStoredCoordinateReferenceSystemsMappedByCode } from './';

describe('Selectors - Location', () => {
  let state;

  beforeEach(() => {
    state = {
      view: {
        coordinateReferenceSystems: {
          storedSystems: [epsg2154, epsg2946, epsg3857, epsg4269, epsg5367],
        },
        userPreferences: {
          gpsFormat: GPS_FORMATS.DEG,
        }
      },
    };
  });

  describe('selectCoordinatesRepresentation', () => {
    test('returns the GPS format string', () => {
      expect(selectCoordinatesRepresentation(state)).toBe(GPS_FORMATS.DEG);
    });

    test('returns a coordinate reference system object', () => {
      state.view.userPreferences.gpsFormat = '5367';

      expect(selectCoordinatesRepresentation(state)).toEqual(epsg5367);
    });
  });

  describe('selectStoredCoordinateReferenceSystemsMappedByCode', () => {
    test('maps the stored coordinate reference systems by code', () => {
      expect(selectStoredCoordinateReferenceSystemsMappedByCode(state)).toEqual({
        2154: epsg2154,
        2946: epsg2946,
        3857: epsg3857,
        4269: epsg4269,
        5367: epsg5367,
      });
    });
  });
});
