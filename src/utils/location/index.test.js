import { GPS_FORMATS, normalizeLocationTextToLngLat, transformLngLatToLocationType, validateLocation } from './';

describe('Utils - location', () => {
  const epsg2154 = {
    area: 'France - onshore and offshore, mainland and Corsica (France métropolitaine including Corsica).',
    bbox: [51.56, -9.86, 41.15, 10.38],
    code: '2154',
    name: 'RGF93 v1 / Lambert-93',
    proj4: '+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  };
  const epsg2946 = {
    area: 'Canada - Quebec and Labrador between 63°W and 60°W.',
    bbox: [58.92, -63, 47.16, -60],
    code: '2946',
    name: 'NAD83(CSRS) / MTM zone 4',
    proj4: '+proj=tmerc +lat_0=0 +lon_0=-61.5 +k=0.9999 +x_0=304800 +y_0=0 +ellps=GRS80 +towgs84=-0.991,1.9072,0.5129,-1.25033e-07,-4.6785e-08,-5.6529e-08,0 +units=m +no_defs +type=crs'
  };
  const epsg3857 = {
    area: 'World between 85.06°S and 85.06°N.',
    bbox: [85.06, -180, -85.06, 180],
    code: '3857',
    name: 'WGS 84 / Pseudo-Mercator',
    proj4: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs',
  };
  const epsg4269 = {
    area: 'North America - onshore and offshore: Canada - Alberta; British Columbia; Manitoba; New Brunswick; Newfoundland and Labrador; Northwest Territories; Nova Scotia; Nunavut; Ontario; Prince Edward Island; Quebec; Saskatchewan; Yukon. Puerto Rico. United States (USA) - Alabama; Alaska; Arizona; Arkansas; California; Colorado; Connecticut; Delaware; Florida; Georgia; Hawaii; Idaho; Illinois; Indiana; Iowa; Kansas; Kentucky; Louisiana; Maine; Maryland; Massachusetts; Michigan; Minnesota; Mississippi; Missouri; Montana; Nebraska; Nevada; New Hampshire; New Jersey; New Mexico; New York; North Carolina; North Dakota; Ohio; Oklahoma; Oregon; Pennsylvania; Rhode Island; South Carolina; South Dakota; Tennessee; Texas; Utah; Vermont; Virginia; Washington; West Virginia; Wisconsin; Wyoming. US Virgin Islands. British Virgin Islands.',
    bbox: [86.45, 167.65, 14.92, -40.73],
    code: '4269',
    name: 'NAD83',
    proj4: '+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs +type=crs',
  };
  const epsg5367 = {
    area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
    bbox: [11.77, -86.5, 2.21, -81.43],
    code: '5367',
    name: 'CR05 / CRTM05',
    proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
  };
  const epsg32633 = {
    area: 'Between 12°E and 18°E, northern hemisphere between equator and 84°N, onshore and offshore. Austria. Bosnia and Herzegovina. Cameroon. Central African Republic. Chad. Congo. Croatia. Czechia. Democratic Republic of the Congo (Zaire). Gabon. Germany. Hungary. Italy. Libya. Malta. Niger. Nigeria. Norway. Poland. San Marino. Slovakia. Slovenia. Svalbard. Sweden. Vatican City State.',
    bbox: [84, 12, 0, 18],
    code: '32633',
    name: 'WGS 84 / UTM zone 33N',
    proj4: '+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs +type=crs',
  };
  const epsg32719 = {
    area: 'Between 72°W and 66°W, southern hemisphere between 80°S and equator, onshore and offshore. Argentina. Bolivia. Brazil. Chile. Colombia. Peru.',
    bbox: [0, -72, -80, -66],
    code: '32719',
    name: 'WGS 84 / UTM zone 19S',
    proj4: '+proj=utm +zone=19 +south +datum=WGS84 +units=m +no_defs +type=crs',
  };

  describe('normalizeLocationTextToLngLat', () => {
    it('handles invalid locations when transforming from DEG GPS format', () => {
      expect(normalizeLocationTextToLngLat('', GPS_FORMATS.DEG)).toBe(null);
      expect(normalizeLocationTextToLngLat(null, GPS_FORMATS.DEG)).toBe(null);
      expect(normalizeLocationTextToLngLat(undefined, GPS_FORMATS.DEG)).toBe(null);
      expect(normalizeLocationTextToLngLat({}, GPS_FORMATS.DEG)).toBe(null);
      expect(normalizeLocationTextToLngLat('   ', GPS_FORMATS.DEG)).toBe(null);
      expect(normalizeLocationTextToLngLat('abcd', GPS_FORMATS.DEG)).toBe(null);
      expect(normalizeLocationTextToLngLat('NaN, NaN', GPS_FORMATS.DEG)).toBe(null);
      expect(normalizeLocationTextToLngLat('1.2.3.4', GPS_FORMATS.DEG)).toBe(null);
      expect(normalizeLocationTextToLngLat('1, 2, 3', GPS_FORMATS.DEG)).toBe(null);
    });

    it('handles valid locations when transforming from DEG GPS format', () => {
      expect(normalizeLocationTextToLngLat('0, 0', GPS_FORMATS.DEG)).toEqual({ latitude: 0, longitude: 0 });
      expect(normalizeLocationTextToLngLat('45.123, -93.456', GPS_FORMATS.DEG))
        .toEqual({ latitude: 45.123, longitude: -93.456 });
      expect(normalizeLocationTextToLngLat('-90, 180', GPS_FORMATS.DEG)).toEqual({ latitude: -90, longitude: 180 });
      expect(normalizeLocationTextToLngLat('  12.34 , 56.78  ', GPS_FORMATS.DEG))
        .toEqual({ latitude: 12.34, longitude: 56.78 });
      expect(normalizeLocationTextToLngLat('+23.5, -102.1', GPS_FORMATS.DEG))
        .toEqual({ latitude: 23.5, longitude: -102.1 });
    });

    it('handles invalid locations when transforming from DMS GPS format', () => {
      expect(normalizeLocationTextToLngLat('', GPS_FORMATS.DMS)).toBe(null);
      expect(normalizeLocationTextToLngLat(null, GPS_FORMATS.DMS)).toBe(null);
      expect(normalizeLocationTextToLngLat(undefined, GPS_FORMATS.DMS)).toBe(null);
      expect(normalizeLocationTextToLngLat({}, GPS_FORMATS.DMS)).toBe(null);
      expect(normalizeLocationTextToLngLat('   ', GPS_FORMATS.DMS)).toBe(null);
      expect(normalizeLocationTextToLngLat('abcd', GPS_FORMATS.DMS)).toBe(null);
      expect(normalizeLocationTextToLngLat('NaN, NaN', GPS_FORMATS.DMS)).toBe(null);
      expect(normalizeLocationTextToLngLat('1.2.3.4', GPS_FORMATS.DMS)).toBe(null);
      expect(normalizeLocationTextToLngLat('1, 2, 3', GPS_FORMATS.DMS)).toBe(null);
    });

    it('handles valid locations when transforming from DMS GPS format', () => {
      expect(normalizeLocationTextToLngLat('00° 00′ 00″ N, 000° 00′ 00″ E', GPS_FORMATS.DMS))
        .toEqual({ latitude: 0, longitude: 0 });
      expect(normalizeLocationTextToLngLat('45° 7′ 22.8″ N, 93° 27′ 21.6″ W', GPS_FORMATS.DMS))
        .toEqual({ latitude: 45.123, longitude: -93.456 });
      expect(normalizeLocationTextToLngLat('90° 0′ 0″ S, 180° 0′ 0″ W', GPS_FORMATS.DMS))
        .toEqual({ latitude: -90, longitude: -180 });
      expect(normalizeLocationTextToLngLat('12° 20′ 24″ N, 56° 46′ 48″ E', GPS_FORMATS.DMS))
        .toEqual({ latitude: 12.34, longitude: 56.78 });
      expect(normalizeLocationTextToLngLat('23° 30′ 0″ N, 102° 6′ 0″ W', GPS_FORMATS.DMS))
        .toEqual({ latitude: 23.5, longitude: -102.1 });
    });

    it('handles invalid locations when transforming from DDM GPS format', () => {
      expect(normalizeLocationTextToLngLat('', GPS_FORMATS.DDM)).toBe(null);
      expect(normalizeLocationTextToLngLat(null, GPS_FORMATS.DDM)).toBe(null);
      expect(normalizeLocationTextToLngLat(undefined, GPS_FORMATS.DDM)).toBe(null);
      expect(normalizeLocationTextToLngLat({}, GPS_FORMATS.DDM)).toBe(null);
      expect(normalizeLocationTextToLngLat('   ', GPS_FORMATS.DDM)).toBe(null);
      expect(normalizeLocationTextToLngLat('abcd', GPS_FORMATS.DDM)).toBe(null);
      expect(normalizeLocationTextToLngLat('NaN, NaN', GPS_FORMATS.DDM)).toBe(null);
      expect(normalizeLocationTextToLngLat('1.2.3.4', GPS_FORMATS.DDM)).toBe(null);
      expect(normalizeLocationTextToLngLat('1, 2, 3', GPS_FORMATS.DDM)).toBe(null);
    });

    it('handles valid locations when transforming from DDM GPS format', () => {
      expect(normalizeLocationTextToLngLat('00° 00.000′ N, 000° 00.000′ E', GPS_FORMATS.DDM))
        .toEqual({ latitude: 0, longitude: 0 });
      expect(normalizeLocationTextToLngLat('45° 7.380′ N, 93° 27.360′ W', GPS_FORMATS.DDM))
        .toEqual({ latitude: 45.123, longitude: -93.456 });
      expect(normalizeLocationTextToLngLat('90° 0.000′ S, 180° 0.000′ W', GPS_FORMATS.DDM))
        .toEqual({ latitude: -90, longitude: -180 });
      expect(normalizeLocationTextToLngLat('12° 20.400′ N, 56° 46.800′ E', GPS_FORMATS.DDM))
        .toEqual({ latitude: 12.34, longitude: 56.78 });
      expect(normalizeLocationTextToLngLat('23° 30.000′ N, 102° 6.000′ W', GPS_FORMATS.DDM))
        .toEqual({ latitude: 23.5, longitude: -102.1 });
    });

    it('handles invalid locations when transforming from UTM GPS format', () => {
      expect(normalizeLocationTextToLngLat('', GPS_FORMATS.UTM)).toBe(null);
      expect(normalizeLocationTextToLngLat(null, GPS_FORMATS.UTM)).toBe(null);
      expect(normalizeLocationTextToLngLat(undefined, GPS_FORMATS.UTM)).toBe(null);
      expect(normalizeLocationTextToLngLat({}, GPS_FORMATS.UTM)).toBe(null);
      expect(normalizeLocationTextToLngLat('   ', GPS_FORMATS.UTM)).toBe(null);
      expect(normalizeLocationTextToLngLat('abcd', GPS_FORMATS.UTM)).toBe(null);
      expect(normalizeLocationTextToLngLat('NaN, NaN', GPS_FORMATS.UTM)).toBe(null);
      expect(normalizeLocationTextToLngLat('1.2.3.4', GPS_FORMATS.UTM)).toBe(null);
      expect(normalizeLocationTextToLngLat('1, 2, 3', GPS_FORMATS.UTM)).toBe(null);
    });

    it('handles valid locations when transforming from UTM GPS format', () => {
      expect(normalizeLocationTextToLngLat('33 N 500000 4649776', GPS_FORMATS.UTM))
        .toEqual({ latitude: 41.999998, longitude: 15 });
      expect(normalizeLocationTextToLngLat('33 N 410437.044 5636797.578', GPS_FORMATS.UTM))
        .toEqual({ latitude: 50.875909, longitude: 13.726993 });
      expect(normalizeLocationTextToLngLat('48 S 217902.008 9965673.807', GPS_FORMATS.UTM))
        .toEqual({ latitude: -0.310254, longitude: 102.465652 });
      expect(normalizeLocationTextToLngLat('18 S 582278 5460519', GPS_FORMATS.UTM))
        .toEqual({ latitude: -41.002369, longitude: -74.021654 });
      expect(normalizeLocationTextToLngLat('14 N 347634.94 2783013.50', GPS_FORMATS.UTM))
        .toEqual({ latitude: 25.155434, longitude: -100.511709 });
    });

    it('handles invalid locations when transforming from MGRS GPS format', () => {
      expect(normalizeLocationTextToLngLat('', GPS_FORMATS.MGRS)).toBe(null);
      expect(normalizeLocationTextToLngLat(null, GPS_FORMATS.MGRS)).toBe(null);
      expect(normalizeLocationTextToLngLat(undefined, GPS_FORMATS.MGRS)).toBe(null);
      expect(normalizeLocationTextToLngLat({}, GPS_FORMATS.MGRS)).toBe(null);
      expect(normalizeLocationTextToLngLat('   ', GPS_FORMATS.MGRS)).toBe(null);
      expect(normalizeLocationTextToLngLat('abcd', GPS_FORMATS.MGRS)).toBe(null);
      expect(normalizeLocationTextToLngLat('NaN, NaN', GPS_FORMATS.MGRS)).toBe(null);
      expect(normalizeLocationTextToLngLat('1.2.3.4', GPS_FORMATS.MGRS)).toBe(null);
      expect(normalizeLocationTextToLngLat('1, 2, 3', GPS_FORMATS.MGRS)).toBe(null);
    });

    it('handles valid locations when transforming from MGRS GPS format', () => {
      expect(normalizeLocationTextToLngLat('33T WG 00000 49776', GPS_FORMATS.MGRS))
        .toEqual({ latitude: 41.999998, longitude: 15 });
      expect(normalizeLocationTextToLngLat('33U VS 10437 36797', GPS_FORMATS.MGRS))
        .toEqual({ latitude: 50.875904, longitude: 13.726993 });
      expect(normalizeLocationTextToLngLat('48M TE 17902 65673', GPS_FORMATS.MGRS))
        .toEqual({ latitude: -0.310261, longitude: 102.465652 });
      expect(normalizeLocationTextToLngLat('18G WV 82278 60519', GPS_FORMATS.MGRS))
        .toEqual({ latitude: -41.002369, longitude: -74.021654 });
      expect(normalizeLocationTextToLngLat('14R LN 47634 83013', GPS_FORMATS.MGRS))
        .toEqual({ latitude: 25.15543, longitude: -100.511719 });
    });

    it('throws an error if an invalid GPS format is provided', () => {
      expect(() => normalizeLocationTextToLngLat('0, 0', 'invalid')).toThrow(
        'Unsupported locationType invalid: must be a known GPS format or a proj4 compatible coordinate reference system object'
      );
    });

    it('handles invalid locations when transforming from a coordinate reference system', () => {
      expect(normalizeLocationTextToLngLat('', epsg2154)).toBe(null);
      expect(normalizeLocationTextToLngLat(null, epsg2946)).toBe(null);
      expect(normalizeLocationTextToLngLat(undefined, epsg3857)).toBe(null);
      expect(normalizeLocationTextToLngLat({}, epsg4269)).toBe(null);
      expect(normalizeLocationTextToLngLat('   ', epsg5367)).toBe(null);
      expect(normalizeLocationTextToLngLat('abcd', epsg32633)).toBe(null);
      expect(normalizeLocationTextToLngLat('NaN, NaN', epsg32719)).toBe(null);
      expect(normalizeLocationTextToLngLat('1.2.3.4', epsg32719)).toBe(null);
      expect(normalizeLocationTextToLngLat('1, 2, 3', epsg32719)).toBe(null);
    });

    it('handles valid locations when transforming from a coordinate reference system', () => {
      expect(normalizeLocationTextToLngLat('-4845662.665438537, 8897548.794431165', epsg2154))
        .toEqual({ latitude: 40.7128, longitude: -74.006 });
      expect(normalizeLocationTextToLngLat('6038625.3, 8100395.8', epsg2946))
        .toEqual({ latitude: 41.902801, longitude: 12.496403 });
      expect(normalizeLocationTextToLngLat('-7866870.4907, -3955040.6406', epsg3857))
        .toEqual({ latitude: -33.4489, longitude: -70.6693 });
      expect(normalizeLocationTextToLngLat('51.5074, 0.1278', epsg4269))
        .toEqual({ latitude: 0.1278, longitude: 51.5074 });
      expect(normalizeLocationTextToLngLat('1162197.59, -10046527.02', epsg5367))
        .toEqual({ latitude: -84.067124, longitude: 9.928927 });
      expect(normalizeLocationTextToLngLat('-1188647.890446, 11.445676', epsg32633))
        .toEqual({ latitude: 0.0001, longitude: 0.0001 });
      expect(normalizeLocationTextToLngLat('500010, 19997960', epsg32719))
        .toEqual({ latitude: 89.9999, longitude: -5.303284 });
    });

    it('throws an error if an invalid location type is provided', () => {
      expect(() => normalizeLocationTextToLngLat('0, 0', undefined)).toThrow(
        'Unsupported locationType: must be a known GPS format or a proj4 compatible coordinate reference system object'
      );
    });
  });

  describe('transformLngLatToLocationType', () => {
    it('returns an empty string if the location is invalid', () => {
      expect(transformLngLatToLocationType(undefined, GPS_FORMATS.DEG)).toBe('');
      expect(transformLngLatToLocationType(null, GPS_FORMATS.DMS)).toBe('');
      expect(transformLngLatToLocationType('', GPS_FORMATS.DDM)).toBe('');
      expect(transformLngLatToLocationType('0, 0', GPS_FORMATS.UTM)).toBe('');
      expect(transformLngLatToLocationType([0, 0], GPS_FORMATS.MGRS)).toBe('');
      expect(transformLngLatToLocationType({ lat: null, lon: null }, epsg2154)).toBe('');
      expect(transformLngLatToLocationType({ latitude: null, longitude: null }, epsg2946)).toBe('');
      expect(transformLngLatToLocationType({ latitude: 91, longitude: 0 }, epsg3857)).toBe('');
      expect(transformLngLatToLocationType({ latitude: 0, longitude: 181 }, epsg4269)).toBe('');
    });

    it('returns an empty string if the location type is invalid', () => {
      expect(transformLngLatToLocationType({ latitude: 0, longitude: 0 }, undefined)).toBe('');
      expect(transformLngLatToLocationType({ latitude: 0, longitude: 0 }, null)).toBe('');
      expect(transformLngLatToLocationType({ latitude: 0, longitude: 0 }, 'invalid')).toBe('');
      expect(transformLngLatToLocationType({ latitude: 0, longitude: 0 }, {})).toBe('');
    });

    it('transforms to DEG GPS format', () => {
      expect(transformLngLatToLocationType({ latitude: 40.7128, longitude: -74.0060 }, GPS_FORMATS.DEG))
        .toBe('40.712800°, -74.006000°');
      expect(transformLngLatToLocationType({ latitude: -33.8651, longitude: 151.2099 }, GPS_FORMATS.DEG))
        .toBe('-33.865100°, 151.209900°');
      expect(transformLngLatToLocationType({ latitude: 51.5074, longitude: -0.1278 }, GPS_FORMATS.DEG))
        .toBe('51.507400°, -0.127800°');
      expect(transformLngLatToLocationType({ latitude: 0.0001, longitude: 0.0001 }, GPS_FORMATS.DEG))
        .toBe('0.000100°, 0.000100°');
      expect(transformLngLatToLocationType({ latitude: 89.9999, longitude: 0 }, GPS_FORMATS.DEG))
        .toBe('89.999900°, 0.000000°');
      expect(transformLngLatToLocationType({ latitude: 0, longitude: 179.9999 }, GPS_FORMATS.DEG))
        .toBe('0.000000°, 179.999900°');
    });

    it('transforms to DMS GPS format', () => {
      expect(transformLngLatToLocationType({ latitude: 40.7128, longitude: -74.0060 }, GPS_FORMATS.DMS))
        .toBe('40° 42′ 46.080000″ N, 074° 00′ 21.600000″ W');
      expect(transformLngLatToLocationType({ latitude: -33.8651, longitude: 151.2099 }, GPS_FORMATS.DMS))
        .toBe('33° 51′ 54.360000″ S, 151° 12′ 35.640000″ E');
      expect(transformLngLatToLocationType({ latitude: 51.5074, longitude: -0.1278 }, GPS_FORMATS.DMS))
        .toBe('51° 30′ 26.640000″ N, 000° 07′ 40.080000″ W');
      expect(transformLngLatToLocationType({ latitude: 0.0001, longitude: 0.0001 }, GPS_FORMATS.DMS))
        .toBe('00° 00′ 00.360000″ N, 000° 00′ 00.360000″ E');
      expect(transformLngLatToLocationType({ latitude: 89.9999, longitude: 0 }, GPS_FORMATS.DMS))
        .toBe('89° 59′ 59.640000″ N, 000° 00′ 00.000000″ E');
      expect(transformLngLatToLocationType({ latitude: 0, longitude: 179.9999 }, GPS_FORMATS.DMS))
        .toBe('00° 00′ 00.000000″ N, 179° 59′ 59.640000″ E');
    });

    it('transforms to DDM GPS format', () => {
      expect(transformLngLatToLocationType({ latitude: 40.7128, longitude: -74.0060 }, GPS_FORMATS.DDM))
        .toBe('40° 42.768000′ N, 074° 00.360000′ W');
      expect(transformLngLatToLocationType({ latitude: -33.8651, longitude: 151.2099 }, GPS_FORMATS.DDM))
        .toBe('33° 51.906000′ S, 151° 12.594000′ E');
      expect(transformLngLatToLocationType({ latitude: 51.5074, longitude: -0.1278 }, GPS_FORMATS.DDM))
        .toBe('51° 30.444000′ N, 000° 07.668000′ W');
      expect(transformLngLatToLocationType({ latitude: 0.0001, longitude: 0.0001 }, GPS_FORMATS.DDM))
        .toBe('00° 00.006000′ N, 000° 00.006000′ E');
      expect(transformLngLatToLocationType({ latitude: 89.9999, longitude: 0 }, GPS_FORMATS.DDM))
        .toBe('89° 59.994000′ N, 000° 00.000000′ E');
      expect(transformLngLatToLocationType({ latitude: 0, longitude: 179.9999 }, GPS_FORMATS.DDM))
        .toBe('00° 00.000000′ N, 179° 59.994000′ E');
    });

    it('transforms to UTM GPS format', () => {
      expect(transformLngLatToLocationType({ latitude: 40.7128, longitude: -74.0060 }, GPS_FORMATS.UTM))
        .toBe('18 N 583959 4507351');
      expect(transformLngLatToLocationType({ latitude: -33.8651, longitude: 151.2099 }, GPS_FORMATS.UTM))
        .toBe('56 S 334417 6251360');
      expect(transformLngLatToLocationType({ latitude: 51.5074, longitude: -0.1278 }, GPS_FORMATS.UTM))
        .toBe('30 N 699316 5710164');
      expect(transformLngLatToLocationType({ latitude: 0.0001, longitude: 0.0001 }, GPS_FORMATS.UTM))
        .toBe('31 N 166033 11');
      expect(transformLngLatToLocationType({ latitude: 89.9999, longitude: 0 }, GPS_FORMATS.UTM)).toBe('');
      expect(transformLngLatToLocationType({ latitude: 0, longitude: 179.9999 }, GPS_FORMATS.UTM))
        .toBe('60 N 833967 0');
    });

    it('transforms to MGRS GPS format', () => {
      expect(transformLngLatToLocationType({ latitude: 40.7128, longitude: -74.0060 }, GPS_FORMATS.MGRS))
        .toBe('18T WL 83959 07350');
      expect(transformLngLatToLocationType({ latitude: -33.8651, longitude: 151.2099 }, GPS_FORMATS.MGRS))
        .toBe('56H LH 34416 51359');
      expect(transformLngLatToLocationType({ latitude: 51.5074, longitude: -0.1278 }, GPS_FORMATS.MGRS))
        .toBe('30U XC 99316 10163');
      expect(transformLngLatToLocationType({ latitude: 0.0001, longitude: 0.0001 }, GPS_FORMATS.MGRS))
        .toBe('31N AA 66032 00011');
      expect(transformLngLatToLocationType({ latitude: 89.9999, longitude: 0 }, GPS_FORMATS.MGRS)).toBe('');
      expect(transformLngLatToLocationType({ latitude: 0, longitude: 179.9999 }, GPS_FORMATS.MGRS))
        .toBe('60N ZF 33967 00000');
    });

    it('transforms to a coordinate reference system', () => {
      expect(transformLngLatToLocationType({ latitude: 40.7128, longitude: -74.0060 }, epsg2154))
        .toBe('-4845662.665439, 8897548.794431');
      expect(transformLngLatToLocationType({ latitude: -33.8651, longitude: 151.2099 }, epsg2946))
        .toBe('-2779703.444813, -15728422.372571');
      expect(transformLngLatToLocationType({ latitude: 51.5074, longitude: -0.1278 }, epsg3857))
        .toBe('-14226.630923, 6711542.475588');
      expect(transformLngLatToLocationType({ latitude: 0.0001, longitude: 0.0001 }, epsg4269))
        .toBe('0.000100, 0.000100');
      expect(transformLngLatToLocationType({ latitude: -84.067124, longitude: 9.928927 }, epsg5367))
        .toBe('1162197.591532, -10046527.018092');
      expect(transformLngLatToLocationType({ latitude: 89.9999, longitude: 0 }, epsg32633))
        .toBe('499997.110303, 9997954.158527');
      expect(transformLngLatToLocationType({ latitude: 0, longitude: 179.9999 }, epsg32719))
        .toBe('-10308119.733821, 29995929.886042');
    });
  });

  describe('validateLocation', () => {
    it('returns true if location is valid', () => {
      expect(validateLocation({ lat: 0, lng: 0 })).toBe(true);
      expect(validateLocation({ lat: -2.4543, lng: 47.8392 })).toBe(true);
      expect(validateLocation({ lat: 23.0921, lng: -112.3835 })).toBe(true);
      expect(validateLocation({ lat: 90, lng: -180 })).toBe(true);
      expect(validateLocation({ lat: -90, lng: 180 })).toBe(true);
    });

    it('returns false if location is invalid', () => {
      expect(validateLocation()).toBe(false);
      expect(validateLocation({})).toBe(false);
      expect(validateLocation({ lat: 23.0921 })).toBe(false);
      expect(validateLocation({ lng: -112.3835 })).toBe(false);
      expect(validateLocation({ lat: 0, lng: 181 })).toBe(false);
      expect(validateLocation({ lat: 0, lng: -181 })).toBe(false);
      expect(validateLocation({ lat: 91, lng: 0 })).toBe(false);
      expect(validateLocation({ lat: -91, lng: 0 })).toBe(false);
    });
  });
});
