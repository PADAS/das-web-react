import { getFeatureFlagValue } from './';

jest.mock('../../constants', () => ({
  DEVELOPMENT_FEATURE_FLAGS: { MY_FLAG: false },
}));

describe('getFeatureFlagValue', () => {
  test('returns the development default when the flag is not in the store', () => {
    expect(getFeatureFlagValue({ view: { experimentalFeatures: {} } }, 'MY_FLAG')).toBe(false);
  });

  test('the store value overrides the development default', () => {
    expect(getFeatureFlagValue({ view: { experimentalFeatures: { MY_FLAG: true } } }, 'MY_FLAG')).toBe(true);
  });

  test('tolerates missing state / experimentalFeatures', () => {
    expect(getFeatureFlagValue(undefined, 'MY_FLAG')).toBe(false);
    expect(getFeatureFlagValue({}, 'MY_FLAG')).toBe(false);
  });

  test('throws for an unregistered flag', () => {
    expect(() => getFeatureFlagValue({}, 'NOT_A_FLAG')).toThrow();
  });
});
