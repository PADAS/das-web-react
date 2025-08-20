import {
  getProj4CompatibleCRS,
  GPS_FORMATS,
  OUTSIDE_BBOX,
  parseCoordinates,
  stringifyCoordinates,
  validateLocation,
} from './';

describe('Utils - location', () => {
  let proj4CompatibleCRSByCode;
  beforeAll(async () => {
    const proj4CompatibleCRS = await getProj4CompatibleCRS();
    proj4CompatibleCRSByCode = proj4CompatibleCRS.reduce((accumulator, crs) => {
      accumulator[crs.code] = crs;
      return accumulator;
    }, {});
  });


  describe('parseCoordinates', () => {
    it('handles invalid coordinates when transforming from DEG GPS format', () => {
      expect(parseCoordinates('', GPS_FORMATS.DEG)).toBe(null);
      expect(parseCoordinates(null, GPS_FORMATS.DEG)).toBe(null);
      expect(parseCoordinates(undefined, GPS_FORMATS.DEG)).toBe(null);
      expect(parseCoordinates({}, GPS_FORMATS.DEG)).toBe(null);
      expect(parseCoordinates('   ', GPS_FORMATS.DEG)).toBe(null);
      expect(parseCoordinates('abcd', GPS_FORMATS.DEG)).toBe(null);
      expect(parseCoordinates('NaN, NaN', GPS_FORMATS.DEG)).toBe(null);
      expect(parseCoordinates('1.2.3.4', GPS_FORMATS.DEG)).toBe(null);
      expect(parseCoordinates('1, 2, 3', GPS_FORMATS.DEG)).toBe(null);
    });

    it('handles valid coordinates when transforming from DEG GPS format', () => {
      expect(parseCoordinates('0, 0', GPS_FORMATS.DEG)).toEqual({ latitude: 0, longitude: 0 });
      expect(parseCoordinates('45.123, -93.456', GPS_FORMATS.DEG))
        .toEqual({ latitude: 45.123, longitude: -93.456 });
      expect(parseCoordinates('-90, 180', GPS_FORMATS.DEG)).toEqual({ latitude: -90, longitude: 180 });
      expect(parseCoordinates('  12.34 , 56.78  ', GPS_FORMATS.DEG))
        .toEqual({ latitude: 12.34, longitude: 56.78 });
      expect(parseCoordinates('+23.5, -102.1', GPS_FORMATS.DEG))
        .toEqual({ latitude: 23.5, longitude: -102.1 });
    });

    it('handles invalid coordinates when transforming from DMS GPS format', () => {
      expect(parseCoordinates('', GPS_FORMATS.DMS)).toBe(null);
      expect(parseCoordinates(null, GPS_FORMATS.DMS)).toBe(null);
      expect(parseCoordinates(undefined, GPS_FORMATS.DMS)).toBe(null);
      expect(parseCoordinates({}, GPS_FORMATS.DMS)).toBe(null);
      expect(parseCoordinates('   ', GPS_FORMATS.DMS)).toBe(null);
      expect(parseCoordinates('abcd', GPS_FORMATS.DMS)).toBe(null);
      expect(parseCoordinates('NaN, NaN', GPS_FORMATS.DMS)).toBe(null);
      expect(parseCoordinates('1.2.3.4', GPS_FORMATS.DMS)).toBe(null);
      expect(parseCoordinates('1, 2, 3', GPS_FORMATS.DMS)).toBe(null);
    });

    it('handles valid coordinates when transforming from DMS GPS format', () => {
      expect(parseCoordinates('00° 00′ 00″ N, 000° 00′ 00″ E', GPS_FORMATS.DMS))
        .toEqual({ latitude: 0, longitude: 0 });
      expect(parseCoordinates('45° 7′ 22.8″ N, 93° 27′ 21.6″ W', GPS_FORMATS.DMS))
        .toEqual({ latitude: 45.123, longitude: -93.456 });
      expect(parseCoordinates('90° 0′ 0″ S, 180° 0′ 0″ W', GPS_FORMATS.DMS))
        .toEqual({ latitude: -90, longitude: -180 });
      expect(parseCoordinates('12° 20′ 24″ N, 56° 46′ 48″ E', GPS_FORMATS.DMS))
        .toEqual({ latitude: 12.34, longitude: 56.78 });
      expect(parseCoordinates('23° 30′ 0″ N, 102° 6′ 0″ W', GPS_FORMATS.DMS))
        .toEqual({ latitude: 23.5, longitude: -102.1 });
    });

    it('handles invalid coordinates when transforming from DDM GPS format', () => {
      expect(parseCoordinates('', GPS_FORMATS.DDM)).toBe(null);
      expect(parseCoordinates(null, GPS_FORMATS.DDM)).toBe(null);
      expect(parseCoordinates(undefined, GPS_FORMATS.DDM)).toBe(null);
      expect(parseCoordinates({}, GPS_FORMATS.DDM)).toBe(null);
      expect(parseCoordinates('   ', GPS_FORMATS.DDM)).toBe(null);
      expect(parseCoordinates('abcd', GPS_FORMATS.DDM)).toBe(null);
      expect(parseCoordinates('NaN, NaN', GPS_FORMATS.DDM)).toBe(null);
      expect(parseCoordinates('1.2.3.4', GPS_FORMATS.DDM)).toBe(null);
      expect(parseCoordinates('1, 2, 3', GPS_FORMATS.DDM)).toBe(null);
    });

    it('handles valid coordinates when transforming from DDM GPS format', () => {
      expect(parseCoordinates('00° 00.000′ N, 000° 00.000′ E', GPS_FORMATS.DDM))
        .toEqual({ latitude: 0, longitude: 0 });
      expect(parseCoordinates('45° 7.380′ N, 93° 27.360′ W', GPS_FORMATS.DDM))
        .toEqual({ latitude: 45.123, longitude: -93.456 });
      expect(parseCoordinates('90° 0.000′ S, 180° 0.000′ W', GPS_FORMATS.DDM))
        .toEqual({ latitude: -90, longitude: -180 });
      expect(parseCoordinates('12° 20.400′ N, 56° 46.800′ E', GPS_FORMATS.DDM))
        .toEqual({ latitude: 12.34, longitude: 56.78 });
      expect(parseCoordinates('23° 30.000′ N, 102° 6.000′ W', GPS_FORMATS.DDM))
        .toEqual({ latitude: 23.5, longitude: -102.1 });
    });

    it('handles invalid coordinates when transforming from UTM GPS format', () => {
      expect(parseCoordinates('', GPS_FORMATS.UTM)).toBe(null);
      expect(parseCoordinates(null, GPS_FORMATS.UTM)).toBe(null);
      expect(parseCoordinates(undefined, GPS_FORMATS.UTM)).toBe(null);
      expect(parseCoordinates({}, GPS_FORMATS.UTM)).toBe(null);
      expect(parseCoordinates('   ', GPS_FORMATS.UTM)).toBe(null);
      expect(parseCoordinates('abcd', GPS_FORMATS.UTM)).toBe(null);
      expect(parseCoordinates('NaN, NaN', GPS_FORMATS.UTM)).toBe(null);
      expect(parseCoordinates('1.2.3.4', GPS_FORMATS.UTM)).toBe(null);
      expect(parseCoordinates('1, 2, 3', GPS_FORMATS.UTM)).toBe(null);
    });

    it('handles valid coordinates when transforming from UTM GPS format', () => {
      expect(parseCoordinates('33 N 500000 4649776', GPS_FORMATS.UTM))
        .toEqual({ latitude: 41.999998, longitude: 15 });
      expect(parseCoordinates('33 N 410437.044 5636797.578', GPS_FORMATS.UTM))
        .toEqual({ latitude: 50.875909, longitude: 13.726993 });
      expect(parseCoordinates('48 S 217902.008 9965673.807', GPS_FORMATS.UTM))
        .toEqual({ latitude: -0.310254, longitude: 102.465652 });
      expect(parseCoordinates('18 S 582278 5460519', GPS_FORMATS.UTM))
        .toEqual({ latitude: -41.002369, longitude: -74.021654 });
      expect(parseCoordinates('14 N 347634.94 2783013.50', GPS_FORMATS.UTM))
        .toEqual({ latitude: 25.155434, longitude: -100.511709 });
    });

    it('handles invalid coordinates when transforming from MGRS GPS format', () => {
      expect(parseCoordinates('', GPS_FORMATS.MGRS)).toBe(null);
      expect(parseCoordinates(null, GPS_FORMATS.MGRS)).toBe(null);
      expect(parseCoordinates(undefined, GPS_FORMATS.MGRS)).toBe(null);
      expect(parseCoordinates({}, GPS_FORMATS.MGRS)).toBe(null);
      expect(parseCoordinates('   ', GPS_FORMATS.MGRS)).toBe(null);
      expect(parseCoordinates('abcd', GPS_FORMATS.MGRS)).toBe(null);
      expect(parseCoordinates('NaN, NaN', GPS_FORMATS.MGRS)).toBe(null);
      expect(parseCoordinates('1.2.3.4', GPS_FORMATS.MGRS)).toBe(null);
      expect(parseCoordinates('1, 2, 3', GPS_FORMATS.MGRS)).toBe(null);
    });

    it('handles valid coordinates when transforming from MGRS GPS format', () => {
      expect(parseCoordinates('33T WG 00000 49776', GPS_FORMATS.MGRS))
        .toEqual({ latitude: 41.999998, longitude: 15 });
      expect(parseCoordinates('33U VS 10437 36797', GPS_FORMATS.MGRS))
        .toEqual({ latitude: 50.875904, longitude: 13.726993 });
      expect(parseCoordinates('48M TE 17902 65673', GPS_FORMATS.MGRS))
        .toEqual({ latitude: -0.310261, longitude: 102.465652 });
      expect(parseCoordinates('18G WV 82278 60519', GPS_FORMATS.MGRS))
        .toEqual({ latitude: -41.002369, longitude: -74.021654 });
      expect(parseCoordinates('14R LN 47634 83013', GPS_FORMATS.MGRS))
        .toEqual({ latitude: 25.15543, longitude: -100.511719 });
    });

    it('throws an error if an invalid GPS format is provided', () => {
      expect(() => parseCoordinates('0, 0', 'invalid')).toThrow(
        'Unsupported coordinates representation "invalid": must be a known GPS format or a proj4 compatible coordinate reference system object'
      );
    });

    it('handles invalid coordinates when transforming from a coordinate reference system', () => {
      expect(parseCoordinates('', proj4CompatibleCRSByCode[2154])).toBe(null);
      expect(parseCoordinates(null, proj4CompatibleCRSByCode[2946])).toBe(null);
      expect(parseCoordinates(undefined, proj4CompatibleCRSByCode[3857])).toBe(null);
      expect(parseCoordinates({}, proj4CompatibleCRSByCode[4269])).toBe(null);
      expect(parseCoordinates('   ', proj4CompatibleCRSByCode[5367])).toBe(null);
      expect(parseCoordinates('abcd', proj4CompatibleCRSByCode[32633])).toBe(null);
      expect(parseCoordinates('NaN, NaN', proj4CompatibleCRSByCode[32719])).toBe(null);
      expect(parseCoordinates('1.2.3.4', proj4CompatibleCRSByCode[32719])).toBe(null);
      expect(parseCoordinates('1, 2, 3', proj4CompatibleCRSByCode[32719])).toBe(null);
    });

    it('handles valid coordinates when transforming from a coordinate reference system', () => {
      expect(parseCoordinates('-4845662.665438537, 8897548.794431165', proj4CompatibleCRSByCode[2154]))
        .toEqual({ latitude: 40.7128, longitude: -74.006 });
      expect(parseCoordinates('6038625.3, 8100395.8', proj4CompatibleCRSByCode[2946]))
        .toEqual({ latitude: 41.902801, longitude: 12.496403 });
      expect(parseCoordinates('-7866870.4907, -3955040.6406', proj4CompatibleCRSByCode[3857]))
        .toEqual({ latitude: -33.4489, longitude: -70.6693 });
      expect(parseCoordinates('51.5074, 0.1278', proj4CompatibleCRSByCode[4269]))
        .toEqual({ latitude: 0.1278, longitude: 51.5074 });
      expect(parseCoordinates('1162197.59, -10046527.02', proj4CompatibleCRSByCode[5367]))
        .toEqual({ latitude: -84.067124, longitude: 9.928927 });
      expect(parseCoordinates('-1188647.890446, 11.445676', proj4CompatibleCRSByCode[32633]))
        .toEqual({ latitude: 0.0001, longitude: 0.0001 });
      expect(parseCoordinates('500010, 19997960', proj4CompatibleCRSByCode[32719]))
        .toEqual({ latitude: 89.9999, longitude: -5.303284 });
    });

    it('throws an error if an invalid coordinate representation is provided', () => {
      expect(() => parseCoordinates('0, 0', null)).toThrow(
        'Unsupported coordinates representation: must be a known GPS format or a proj4 compatible coordinate reference system object'
      );
    });
  });

  describe('stringifyCoordinates', () => {
    it('returns an empty string if the coordinates are invalid', () => {
      expect(stringifyCoordinates(undefined, GPS_FORMATS.DEG)).toBe('');
      expect(stringifyCoordinates(null, GPS_FORMATS.DMS)).toBe('');
      expect(stringifyCoordinates('', GPS_FORMATS.DDM)).toBe('');
      expect(stringifyCoordinates('0, 0', GPS_FORMATS.UTM)).toBe('');
      expect(stringifyCoordinates([0, 0], GPS_FORMATS.MGRS)).toBe('');
      expect(stringifyCoordinates({ lat: null, lon: null }, proj4CompatibleCRSByCode[2154])).toBe('');
      expect(stringifyCoordinates({ latitude: null, longitude: null }, proj4CompatibleCRSByCode[2946])).toBe('');
      expect(stringifyCoordinates({ latitude: 91, longitude: 0 }, proj4CompatibleCRSByCode[3857])).toBe('');
    });

    it('returns an empty string if the representation is invalid', () => {
      expect(stringifyCoordinates({ latitude: 0, longitude: 0 }, null)).toBe('');
      expect(stringifyCoordinates({ latitude: 0, longitude: 0 }, 'invalid')).toBe('');
      expect(stringifyCoordinates({ latitude: 0, longitude: 0 }, {})).toBe('');
    });

    it('transforms to DEG GPS format', () => {
      expect(stringifyCoordinates({ latitude: 40.7128, longitude: -74.0060 }, GPS_FORMATS.DEG))
        .toBe('40.712800°, -74.006000°');
      expect(stringifyCoordinates({ latitude: -33.8651, longitude: 151.2099 }, GPS_FORMATS.DEG))
        .toBe('-33.865100°, 151.209900°');
      expect(stringifyCoordinates({ latitude: 51.5074, longitude: -0.1278 }, GPS_FORMATS.DEG))
        .toBe('51.507400°, -0.127800°');
      expect(stringifyCoordinates({ latitude: 0.0001, longitude: 0.0001 }, GPS_FORMATS.DEG))
        .toBe('0.000100°, 0.000100°');
      expect(stringifyCoordinates({ latitude: 89.9999, longitude: 0 }, GPS_FORMATS.DEG))
        .toBe('89.999900°, 0.000000°');
      expect(stringifyCoordinates({ latitude: 0, longitude: 179.9999 }, GPS_FORMATS.DEG))
        .toBe('0.000000°, 179.999900°');
      expect(stringifyCoordinates({ latitude: 0, longitude: 546.8372 }, GPS_FORMATS.DEG))
        .toBe('0.000000°, -173.162800°');
    });

    it('transforms to DMS GPS format', () => {
      expect(stringifyCoordinates({ latitude: 40.7128, longitude: -74.0060 }, GPS_FORMATS.DMS))
        .toBe('40° 42′ 46.080000″ N, 074° 00′ 21.600000″ W');
      expect(stringifyCoordinates({ latitude: -33.8651, longitude: 151.2099 }, GPS_FORMATS.DMS))
        .toBe('33° 51′ 54.360000″ S, 151° 12′ 35.640000″ E');
      expect(stringifyCoordinates({ latitude: 51.5074, longitude: -0.1278 }, GPS_FORMATS.DMS))
        .toBe('51° 30′ 26.640000″ N, 000° 07′ 40.080000″ W');
      expect(stringifyCoordinates({ latitude: 0.0001, longitude: 0.0001 }, GPS_FORMATS.DMS))
        .toBe('00° 00′ 00.360000″ N, 000° 00′ 00.360000″ E');
      expect(stringifyCoordinates({ latitude: 89.9999, longitude: 0 }, GPS_FORMATS.DMS))
        .toBe('89° 59′ 59.640000″ N, 000° 00′ 00.000000″ E');
      expect(stringifyCoordinates({ latitude: 0, longitude: 179.9999 }, GPS_FORMATS.DMS))
        .toBe('00° 00′ 00.000000″ N, 179° 59′ 59.640000″ E');
      expect(stringifyCoordinates({ latitude: 0, longitude: 546.8372 }, GPS_FORMATS.DMS))
        .toBe('00° 00′ 00.000000″ N, 173° 09′ 46.080000″ W');
    });

    it('transforms to DDM GPS format', () => {
      expect(stringifyCoordinates({ latitude: 40.7128, longitude: -74.0060 }, GPS_FORMATS.DDM))
        .toBe('40° 42.768000′ N, 074° 00.360000′ W');
      expect(stringifyCoordinates({ latitude: -33.8651, longitude: 151.2099 }, GPS_FORMATS.DDM))
        .toBe('33° 51.906000′ S, 151° 12.594000′ E');
      expect(stringifyCoordinates({ latitude: 51.5074, longitude: -0.1278 }, GPS_FORMATS.DDM))
        .toBe('51° 30.444000′ N, 000° 07.668000′ W');
      expect(stringifyCoordinates({ latitude: 0.0001, longitude: 0.0001 }, GPS_FORMATS.DDM))
        .toBe('00° 00.006000′ N, 000° 00.006000′ E');
      expect(stringifyCoordinates({ latitude: 89.9999, longitude: 0 }, GPS_FORMATS.DDM))
        .toBe('89° 59.994000′ N, 000° 00.000000′ E');
      expect(stringifyCoordinates({ latitude: 0, longitude: 179.9999 }, GPS_FORMATS.DDM))
        .toBe('00° 00.000000′ N, 179° 59.994000′ E');
      expect(stringifyCoordinates({ latitude: 0, longitude: 546.8372 }, GPS_FORMATS.DDM))
        .toBe('00° 00.000000′ N, 173° 09.768000′ W');
    });

    it('transforms to UTM GPS format', () => {
      expect(stringifyCoordinates({ latitude: 40.7128, longitude: -74.0060 }, GPS_FORMATS.UTM))
        .toBe('18 N 583959 4507351');
      expect(stringifyCoordinates({ latitude: -33.8651, longitude: 151.2099 }, GPS_FORMATS.UTM))
        .toBe('56 S 334417 6251360');
      expect(stringifyCoordinates({ latitude: 51.5074, longitude: -0.1278 }, GPS_FORMATS.UTM))
        .toBe('30 N 699316 5710164');
      expect(stringifyCoordinates({ latitude: 0.0001, longitude: 0.0001 }, GPS_FORMATS.UTM))
        .toBe('31 N 166033 11');
      expect(stringifyCoordinates({ latitude: 89.9999, longitude: 0 }, GPS_FORMATS.UTM)).toBe('');
      expect(stringifyCoordinates({ latitude: 0, longitude: 179.9999 }, GPS_FORMATS.UTM))
        .toBe('60 N 833967 0');
      expect(stringifyCoordinates({ latitude: 0, longitude: 546.8372 }, GPS_FORMATS.UTM))
        .toBe('02 N 259277 0');
    });

    it('transforms to MGRS GPS format', () => {
      expect(stringifyCoordinates({ latitude: 40.7128, longitude: -74.0060 }, GPS_FORMATS.MGRS))
        .toBe('18T WL 83959 07350');
      expect(stringifyCoordinates({ latitude: -33.8651, longitude: 151.2099 }, GPS_FORMATS.MGRS))
        .toBe('56H LH 34416 51359');
      expect(stringifyCoordinates({ latitude: 51.5074, longitude: -0.1278 }, GPS_FORMATS.MGRS))
        .toBe('30U XC 99316 10163');
      expect(stringifyCoordinates({ latitude: 0.0001, longitude: 0.0001 }, GPS_FORMATS.MGRS))
        .toBe('31N AA 66032 00011');
      expect(stringifyCoordinates({ latitude: 89.9999, longitude: 0 }, GPS_FORMATS.MGRS)).toBe('');
      expect(stringifyCoordinates({ latitude: 0, longitude: 179.9999 }, GPS_FORMATS.MGRS))
        .toBe('60N ZF 33967 00000');
      expect(stringifyCoordinates({ latitude: 0, longitude: 546.8372 }, GPS_FORMATS.MGRS))
        .toBe('02N KF 59276 00000');
    });

    it('transforms to a coordinate reference system', () => {
      expect(stringifyCoordinates({ latitude: 45.771552, longitude: 1.688706 }, proj4CompatibleCRSByCode[2154]))
        .toBe('598098.478884, 6519950.743674');
      expect(stringifyCoordinates({ latitude: 52.158874, longitude: -60.942948 }, proj4CompatibleCRSByCode[2946]))
        .toBe('342917.63975, 5780587.499708');
      expect(stringifyCoordinates({ latitude: 33.911946, longitude: -138.152809 }, proj4CompatibleCRSByCode[3857]))
        .toBe('-15379100.34954, 4016984.644565');
      expect(stringifyCoordinates({ latitude: 80.023202, longitude: -43.539896 }, proj4CompatibleCRSByCode[4269]))
        .toBe('-43.539896, 80.023202');
      expect(stringifyCoordinates({ latitude: 9.638124, longitude: -83.491398 }, proj4CompatibleCRSByCode[5367]))
        .toBe('555818.832808, 1065762.823243');
      expect(stringifyCoordinates({ latitude: 41.742922, longitude: 15.804143 }, proj4CompatibleCRSByCode[32633]))
        .toBe('566864.843233, 4621546.204284');
      expect(stringifyCoordinates({ latitude: 34.544175, longitude: -16.454460 }, proj4CompatibleCRSByCode[32719]))
        .toBe(OUTSIDE_BBOX);
    });
  });

  describe('validateLocation', () => {
    it('returns true if location is valid', () => {
      expect(validateLocation({ lat: 0, lng: 0 })).toBe(true);
      expect(validateLocation({ lat: -2.4543, lng: 47.8392 })).toBe(true);
      expect(validateLocation({ lat: 23.0921, lng: -112.3835 })).toBe(true);
      expect(validateLocation({ lat: 90, lng: -180 })).toBe(true);
      expect(validateLocation({ lat: -90, lng: 180 })).toBe(true);
      expect(validateLocation({ lat: 0, lng: 546.8372 })).toBe(true);
    });

    it('returns false if location is invalid', () => {
      expect(validateLocation()).toBe(false);
      expect(validateLocation({})).toBe(false);
      expect(validateLocation({ lat: 23.0921 })).toBe(false);
      expect(validateLocation({ lng: -112.3835 })).toBe(false);
      expect(validateLocation({ lat: 91, lng: 0 })).toBe(false);
      expect(validateLocation({ lat: -91, lng: 0 })).toBe(false);
    });
  });
});
