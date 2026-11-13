import userPreferencesReducer, {
  INITIAL_STATE,
  SET_PLAY_SOUND_FOR_NEW_EVENTS,
  SET_PLAY_SOUND_FOR_NEW_IN_REACH_MESSAGES,
  SET_PLAY_SOUND_FOR_RADIO_STATE_CHANGE_TO_RED,
  setPlaySoundForNewEvents,
  setPlaySoundForNewInReachMessages,
  setPlaySoundForRadioStateChangeToRed,
  updateUserPreferences,
  userPreferencesMigrations,
} from './';

describe('Ducks - User preferences', () => {
  test('setPlaySoundForNewEvents dispatches the SET_PLAY_SOUND_FOR_NEW_EVENTS action', async () => {
    expect(setPlaySoundForNewEvents(true)).toEqual({
      payload: true,
      type: SET_PLAY_SOUND_FOR_NEW_EVENTS,
    });
  });

  test('setPlaySoundForNewInReachMessages dispatches the SET_PLAY_SOUND_FOR_NEW_IN_REACH_MESSAGES action', async () => {
    expect(setPlaySoundForNewInReachMessages(true)).toEqual({
      payload: true,
      type: SET_PLAY_SOUND_FOR_NEW_IN_REACH_MESSAGES,
    });
  });

  test('setPlaySoundForRadioStateChangeToRed dispatches the SET_PLAY_SOUND_FOR_RADIO_STATE_CHANGE_TO_RED action', async () => {
    expect(setPlaySoundForRadioStateChangeToRed(true)).toEqual({
      payload: true,
      type: SET_PLAY_SOUND_FOR_RADIO_STATE_CHANGE_TO_RED,
    });
  });

  describe('userPreferencesReducer', () => {
    test('returns the initial state', async () => {
      expect(userPreferencesReducer(undefined, {})).toEqual(INITIAL_STATE);
    });

    test('handles a SET_PLAY_SOUND_FOR_NEW_EVENTS action', async () => {
      const payload = true;
      const action = { payload, type: SET_PLAY_SOUND_FOR_NEW_EVENTS };
      const expectedState = { ...INITIAL_STATE, playSoundForNewEvents: true };

      expect(userPreferencesReducer(INITIAL_STATE, action)).toEqual(expectedState);
    });

    test('handles a SET_PLAY_SOUND_FOR_NEW_IN_REACH_MESSAGES action', async () => {
      const payload = true;
      const action = { payload, type: SET_PLAY_SOUND_FOR_NEW_IN_REACH_MESSAGES };
      const expectedState = { ...INITIAL_STATE, playSoundForNewInReachMessages: true };

      expect(userPreferencesReducer(INITIAL_STATE, action)).toEqual(expectedState);
    });

    test('handles a SET_PLAY_SOUND_FOR_RADIO_STATE_CHANGE_TO_RED action', async () => {
      const payload = true;
      const action = { payload, type: SET_PLAY_SOUND_FOR_RADIO_STATE_CHANGE_TO_RED };
      const expectedState = { ...INITIAL_STATE, playSoundForRadioStateChangeToRed: true };

      expect(userPreferencesReducer(INITIAL_STATE, action)).toEqual(expectedState);
    });

    test('handles an update of the Atlas tab width', async () => {
      const action = updateUserPreferences({ atlasTabWidth: 700 });
      const expectedState = { ...INITIAL_STATE, atlasTabWidth: 700 };

      expect(userPreferencesReducer(INITIAL_STATE, action)).toEqual(expectedState);
    });
  });

  describe('userPreferencesMigrations', () => {
    describe('0', () => {
      test('copies the saved otusTabWidth to atlasTabWidth and keeps otusTabWidth', () => {
        expect(userPreferencesMigrations[0]({ ...INITIAL_STATE, atlasTabWidth: undefined, otusTabWidth: 480 }))
          .toEqual({ ...INITIAL_STATE, atlasTabWidth: 480, otusTabWidth: 480 });
      });

      test('copies a saved otusTabWidth when atlasTabWidth is null', () => {
        expect(userPreferencesMigrations[0]({ atlasTabWidth: null, otusTabWidth: 480 }))
          .toEqual({ atlasTabWidth: 480, otusTabWidth: 480 });
      });

      test('does not copy an otusTabWidth that is not a number', () => {
        expect(userPreferencesMigrations[0]({ otusTabWidth: '480' })).toEqual({ otusTabWidth: '480' });
        expect(userPreferencesMigrations[0]({ otusTabWidth: null })).toEqual({ otusTabWidth: null });
      });

      test('keeps an existing atlasTabWidth when both widths are saved', () => {
        expect(userPreferencesMigrations[0]({ atlasTabWidth: 700, otusTabWidth: 480 }))
          .toEqual({ atlasTabWidth: 700, otusTabWidth: 480 });
      });

      test('returns an undefined state unchanged', () => {
        expect(userPreferencesMigrations[0](undefined)).toBeUndefined();
      });
    });
  });
});
