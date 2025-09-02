import { GPS_FORMATS } from '../../utils/location';
import {
  epsg2154,
  epsg2946,
  epsg32633,
  epsg32719,
  epsg3857,
  epsg4269,
  epsg5367
} from '../../__test-helpers/fixtures/location';

import coordinateReferenceSystemsReducer, {
  SET_SELECTED_COORDINATE_REPRESENTATIONS,
  SET_STORED_COORDINATE_REFERENCE_SYSTEMS,
  setSelectedCoordinateRepresentations,
  setStoredCoordinateReferenceSystems,
  INITIAL_STATE,
} from './';

describe('Ducks - Coordinate reference systems', () => {
  test('setSelectedCoordinateRepresentations dispatches the SET_SELECTED_COORDINATE_REPRESENTATIONS action', async () => {
    expect(
      setSelectedCoordinateRepresentations([GPS_FORMATS.DEG, GPS_FORMATS.DMS, GPS_FORMATS.DDM, '4576', '5367'])
    ).toEqual({
      payload: [GPS_FORMATS.DEG, GPS_FORMATS.DMS, GPS_FORMATS.DDM, '4576', '5367'],
      type: SET_SELECTED_COORDINATE_REPRESENTATIONS,
    });
  });

  test('setStoredCoordinateReferenceSystems dispatches the SET_STORED_COORDINATE_REFERENCE_SYSTEMS action', async () => {
    expect(setStoredCoordinateReferenceSystems([epsg5367])).toEqual({
      payload: [epsg5367],
      type: SET_STORED_COORDINATE_REFERENCE_SYSTEMS,
    });
  });

  describe('coordinateReferenceSystemsReducer', () => {
    test('returns the initial state', async () => {
      expect(coordinateReferenceSystemsReducer(undefined, {})).toEqual(INITIAL_STATE);
    });

    test('handles a SET_SELECTED_COORDINATE_REPRESENTATIONS action', async () => {
      const payload = [GPS_FORMATS.DEG, GPS_FORMATS.DMS, GPS_FORMATS.DDM, '4576', '5367'];
      const action = { payload, type: SET_SELECTED_COORDINATE_REPRESENTATIONS };
      const expectedState = {
        selectedCoordinateRepresentations: [GPS_FORMATS.DEG, GPS_FORMATS.DMS, GPS_FORMATS.DDM, '4576', '5367'],
        storedSystems: [],
      };

      expect(coordinateReferenceSystemsReducer(INITIAL_STATE, action)).toEqual(expectedState);
    });

    test('always includes the DEG GPS format and limits the length of the selected systems list when handling a SET_SELECTED_COORDINATE_REPRESENTATIONS action', async () => {
      const payload = [GPS_FORMATS.DMS, GPS_FORMATS.DDM, GPS_FORMATS.UTM, '4576', '5367'];
      const action = { payload, type: SET_SELECTED_COORDINATE_REPRESENTATIONS };
      const expectedState = {
        selectedCoordinateRepresentations: [GPS_FORMATS.DEG, GPS_FORMATS.DMS, GPS_FORMATS.DDM, GPS_FORMATS.UTM, '4576'],
        storedSystems: [],
      };

      expect(coordinateReferenceSystemsReducer(INITIAL_STATE, action)).toEqual(expectedState);
    });

    test('handles a SET_STORED_COORDINATE_REFERENCE_SYSTEMS action', async () => {
      const payload = [epsg5367];
      const action = { payload, type: SET_STORED_COORDINATE_REFERENCE_SYSTEMS };
      const expectedState = {
        selectedCoordinateRepresentations: Object.values(GPS_FORMATS),
        storedSystems: [epsg5367],
      };

      expect(coordinateReferenceSystemsReducer(INITIAL_STATE, action)).toEqual(expectedState);
    });

    test('sorts the stored systems by their code and limits the length of the stored systems list when handling a SET_STORED_COORDINATE_REFERENCE_SYSTEMS action', async () => {
      const payload = [epsg32633, epsg2946, epsg2154, epsg32719, epsg4269, epsg3857, epsg5367];
      const action = { payload, type: SET_STORED_COORDINATE_REFERENCE_SYSTEMS };
      const expectedState = {
        selectedCoordinateRepresentations: Object.values(GPS_FORMATS),
        storedSystems: [epsg2154, epsg2946, epsg3857, epsg4269, epsg32633, epsg32719],
      };

      expect(coordinateReferenceSystemsReducer(INITIAL_STATE, action)).toEqual(expectedState);
    });
  });
});
