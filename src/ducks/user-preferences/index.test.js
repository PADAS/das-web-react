import userPreferencesReducer, {
  INITIAL_STATE,
  SET_PLAY_SOUND_FOR_NEW_EVENTS,
  SET_PLAY_SOUND_FOR_NEW_IN_REACH_MESSAGES,
  SET_PLAY_SOUND_FOR_RADIO_STATE_CHANGE_TO_RED,
  setPlaySoundForNewEvents,
  setPlaySoundForNewInReachMessages,
  setPlaySoundForRadioStateChangeToRed,
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
  });
});
