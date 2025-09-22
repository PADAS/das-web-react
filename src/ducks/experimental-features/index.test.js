import experimentalFeaturesReducer, { INITIAL_STATE, SET_EXPERIMENTAL_FEATURES, setExperimentalFeatures } from './';

jest.mock('../../constants', () => ({
  ...jest.requireActual('../../constants'),
  DEVELOPMENT_FEATURE_FLAGS: { DUMMY_FF_FOR_TESTING_1: true, DUMMY_FF_FOR_TESTING_2: true },
}));

describe('Ducks - Experimental features', () => {
  test('setExperimentalFeatures dispatches the SET_EXPERIMENTAL_FEATURES action', async () => {
    expect(setExperimentalFeatures({ experimentalFeature: true })).toEqual({
      payload: {
        experimentalFeature: true,
      },
      type: SET_EXPERIMENTAL_FEATURES,
    });
  });

  describe('experimentalFeaturesReducer', () => {
    test('returns the initial state', async () => {
      expect(experimentalFeaturesReducer(undefined, {})).toEqual(INITIAL_STATE);
    });

    test('handles a SET_EXPERIMENTAL_FEATURES action filtering just the valid development feature flags', async () => {
      const payload = {
        DUMMY_FF_FOR_TESTING_1: true,
        DUMMY_FF_FOR_TESTING_2: false,
        DUMMY_FF_FOR_TESTING_INVALID: true,
      };
      const action = { payload, type: SET_EXPERIMENTAL_FEATURES };
      const expectedState = {
        DUMMY_FF_FOR_TESTING_1: true,
        DUMMY_FF_FOR_TESTING_2: false,
      };

      expect(experimentalFeaturesReducer(INITIAL_STATE, action)).toEqual(expectedState);
    });
  });
});
