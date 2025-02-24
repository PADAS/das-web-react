import {
  INITIAL_TRACK_SETTINGS_STATE,
  SET_TRACK_SETTINGS_DEFAULT_CUSTOM_TRACK_LENGTH,
  SET_TRACK_SETTINGS_IS_TIME_OF_DAY_COLORING_ACTIVE,
  SET_TRACK_SETTINGS_LENGTH,
  SET_TRACK_SETTINGS_TIME_OF_DAY_TIME_ZONE,
  SET_TRACK_SETTINGS_TRACK_LENGTH_ORIGIN,
  setDefaultCustomTrackLength,
  setIsTimeOfDayColoringActive,
  setTimeOfDayTimeZone,
  setTrackLength,
  setTrackLengthOrigin,
  TRACK_LENGTH_ORIGINS,
  trackSettingsReducer,
} from './';

jest.mock('../../store');

describe('Ducks - Tracks', () => {
  test('setDefaultCustomTrackLength dispatches the SET_TRACK_SETTINGS_DEFAULT_CUSTOM_TRACK_LENGTH action', () => {
    expect(setDefaultCustomTrackLength(60))
      .toEqual({ payload: 60, type: SET_TRACK_SETTINGS_DEFAULT_CUSTOM_TRACK_LENGTH });
  });

  test('setIsTimeOfDayColoringActive dispatches the SET_TRACK_SETTINGS_IS_TIME_OF_DAY_COLORING_ACTIVE action', () => {
    expect(setIsTimeOfDayColoringActive(true))
      .toEqual({ payload: true, type: SET_TRACK_SETTINGS_IS_TIME_OF_DAY_COLORING_ACTIVE });
  });

  test('setTimeOfDayTimeZone dispatches the SET_TRACK_SETTINGS_TIME_OF_DAY_TIME_ZONE action', () => {
    expect(setTimeOfDayTimeZone('America/Mexico_City'))
      .toEqual({ payload: 'America/Mexico_City', type: SET_TRACK_SETTINGS_TIME_OF_DAY_TIME_ZONE });
  });

  test('setTrackLength dispatches the SET_TRACK_SETTINGS_LENGTH action', () => {
    expect(setTrackLength(60)).toEqual({ payload: 60, type: SET_TRACK_SETTINGS_LENGTH });
  });

  test('setTrackLengthOrigin dispatches the SET_TRACK_SETTINGS_TRACK_LENGTH_ORIGIN action', () => {
    expect(setTrackLengthOrigin(TRACK_LENGTH_ORIGINS.EVENT_FILTER))
      .toEqual({ payload: TRACK_LENGTH_ORIGINS.EVENT_FILTER, type: SET_TRACK_SETTINGS_TRACK_LENGTH_ORIGIN });
  });

  describe('trackSettingsReducer', () => {
    test('returns the initial state', async () => {
      expect(trackSettingsReducer(undefined, {})).toEqual(INITIAL_TRACK_SETTINGS_STATE);
    });

    test('handles a SET_TRACK_SETTINGS_DEFAULT_CUSTOM_TRACK_LENGTH action', async () => {
      const action = { payload: 60, type: SET_TRACK_SETTINGS_DEFAULT_CUSTOM_TRACK_LENGTH };
      const expectedState = {
        defaultCustomTrackLength: 60,
        isTimeOfDayColoringActive: false,
        length: 21,
        origin: TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH,
        timeOfDayTimeZone: null,
      };

      expect(trackSettingsReducer(INITIAL_TRACK_SETTINGS_STATE, action)).toEqual(expectedState);
    });

    test('handles a SET_TRACK_SETTINGS_IS_TIME_OF_DAY_COLORING_ACTIVE action', async () => {
      const action = { payload: true, type: SET_TRACK_SETTINGS_IS_TIME_OF_DAY_COLORING_ACTIVE };
      const expectedState = {
        defaultCustomTrackLength: undefined,
        isTimeOfDayColoringActive: true,
        length: 21,
        origin: TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH,
        timeOfDayTimeZone: null,
      };

      expect(trackSettingsReducer(INITIAL_TRACK_SETTINGS_STATE, action)).toEqual(expectedState);
    });

    test('handles a SET_TRACK_SETTINGS_TIME_OF_DAY_TIME_ZONE action', async () => {
      const action = { payload: 'America/Mexico_City', type: SET_TRACK_SETTINGS_TIME_OF_DAY_TIME_ZONE };
      const expectedState = {
        defaultCustomTrackLength: undefined,
        isTimeOfDayColoringActive: false,
        length: 21,
        origin: TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH,
        timeOfDayTimeZone: 'America/Mexico_City',
      };

      expect(trackSettingsReducer(INITIAL_TRACK_SETTINGS_STATE, action)).toEqual(expectedState);
    });

    test('handles a SET_TRACK_SETTINGS_LENGTH action', async () => {
      const action = { payload: 60, type: SET_TRACK_SETTINGS_LENGTH };
      const expectedState = {
        defaultCustomTrackLength: undefined,
        isTimeOfDayColoringActive: false,
        length: 60,
        origin: TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH,
        timeOfDayTimeZone: null,
      };

      expect(trackSettingsReducer(INITIAL_TRACK_SETTINGS_STATE, action)).toEqual(expectedState);
    });

    test('handles a SET_TRACK_SETTINGS_TRACK_LENGTH_ORIGIN action', async () => {
      const action = { payload: TRACK_LENGTH_ORIGINS.EVENT_FILTER, type: SET_TRACK_SETTINGS_TRACK_LENGTH_ORIGIN };
      const expectedState = {
        defaultCustomTrackLength: undefined,
        isTimeOfDayColoringActive: false,
        length: 21,
        origin: TRACK_LENGTH_ORIGINS.EVENT_FILTER,
        timeOfDayTimeZone: null,
      };

      expect(trackSettingsReducer(INITIAL_TRACK_SETTINGS_STATE, action)).toEqual(expectedState);
    });
  });
});
