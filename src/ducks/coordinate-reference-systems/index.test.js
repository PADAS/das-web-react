import { GPS_FORMATS } from '../../utils/location';

import coordinateReferenceSystemsReducer, {
  SET_SELECTED_COORDINATE_REFERENCE_SYSTEMS,
  SET_STORED_COORDINATE_REFERENCE_SYSTEMS,
  setSelectedCoordinateReferenceSystems,
  setStoredCoordinateReferenceSystems,
  INITIAL_STATE,
} from './';

describe('Ducks - Coordinate reference systems', () => {
  test('setSelectedCoordinateReferenceSystems dispatches the SET_SELECTED_COORDINATE_REFERENCE_SYSTEMS action', async () => {
    expect(
      setSelectedCoordinateReferenceSystems([GPS_FORMATS.DEG, GPS_FORMATS.DMS, GPS_FORMATS.DDM, '4576', '5367'])
    ).toEqual({
      payload: [GPS_FORMATS.DEG, GPS_FORMATS.DMS, GPS_FORMATS.DDM, '4576', '5367'],
      type: SET_SELECTED_COORDINATE_REFERENCE_SYSTEMS,
    });
  });

  test('setStoredCoordinateReferenceSystems dispatches the SET_STORED_COORDINATE_REFERENCE_SYSTEMS action', async () => {
    expect(
      setStoredCoordinateReferenceSystems([{
        area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
        bbox: [11.77, -86.5, 2.21, -81.43],
        code: '5367',
        name: 'CR05 / CRTM05',
        proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
      }])
    ).toEqual({
      payload: [{
        area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
        bbox: [11.77, -86.5, 2.21, -81.43],
        code: '5367',
        name: 'CR05 / CRTM05',
        proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
      }],
      type: SET_STORED_COORDINATE_REFERENCE_SYSTEMS,
    });
  });

  describe('coordinateReferenceSystemsReducer', () => {
    test('returns the initial state', async () => {
      expect(coordinateReferenceSystemsReducer(undefined, {})).toEqual(INITIAL_STATE);
    });

    test('handles a SET_SELECTED_COORDINATE_REFERENCE_SYSTEMS action', async () => {
      const payload = [GPS_FORMATS.DEG, GPS_FORMATS.DMS, GPS_FORMATS.DDM, '4576', '5367'];
      const action = { payload, type: SET_SELECTED_COORDINATE_REFERENCE_SYSTEMS };
      const expectedState = {
        selectedSystems: [GPS_FORMATS.DEG, GPS_FORMATS.DMS, GPS_FORMATS.DDM, '4576', '5367'],
        storedSystems: [],
      };

      expect(coordinateReferenceSystemsReducer(INITIAL_STATE, action)).toEqual(expectedState);
    });

    test('always includes the DEG GPS format and limits the length of the selected systems list when handling a SET_SELECTED_COORDINATE_REFERENCE_SYSTEMS action', async () => {
      const payload = [GPS_FORMATS.DMS, GPS_FORMATS.DDM, GPS_FORMATS.UTM, '4576', '5367'];
      const action = { payload, type: SET_SELECTED_COORDINATE_REFERENCE_SYSTEMS };
      const expectedState = {
        selectedSystems: [GPS_FORMATS.DEG, GPS_FORMATS.DMS, GPS_FORMATS.DDM, GPS_FORMATS.UTM, '4576'],
        storedSystems: [],
      };

      expect(coordinateReferenceSystemsReducer(INITIAL_STATE, action)).toEqual(expectedState);
    });

    test('handles a SET_STORED_COORDINATE_REFERENCE_SYSTEMS action', async () => {
      const payload = [{
        area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
        bbox: [11.77, -86.5, 2.21, -81.43],
        code: '5367',
        name: 'CR05 / CRTM05',
        proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
      }];
      const action = { payload, type: SET_STORED_COORDINATE_REFERENCE_SYSTEMS };
      const expectedState = {
        selectedSystems: Object.values(GPS_FORMATS),
        storedSystems: [{
          area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
          bbox: [11.77, -86.5, 2.21, -81.43],
          code: '5367',
          name: 'CR05 / CRTM05',
          proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
        }],
      };

      expect(coordinateReferenceSystemsReducer(INITIAL_STATE, action)).toEqual(expectedState);
    });
  });
});
