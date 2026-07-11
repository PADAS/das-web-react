import { getFeatureFlagValue, getPreviewFeatureValue } from './';

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

describe('getPreviewFeatureValue', () => {
  test('returns false when the preview feature is not in the store', () => {
    expect(getPreviewFeatureValue({ view: { systemConfig: { previewFeatures: {} } } }, 'my_feature')).toBe(false);
  });

  test('returns true when the preview feature is enabled in the store', () => {
    expect(getPreviewFeatureValue({ view: { systemConfig: { previewFeatures: { my_feature: true } } } }, 'my_feature')).toBe(true);
  });

  test('tolerates missing state / systemConfig / previewFeatures', () => {
    expect(getPreviewFeatureValue(undefined, 'my_feature')).toBe(false);
    expect(getPreviewFeatureValue({}, 'my_feature')).toBe(false);
    expect(getPreviewFeatureValue({ view: {} }, 'my_feature')).toBe(false);
    expect(getPreviewFeatureValue({ view: { systemConfig: {} } }, 'my_feature')).toBe(false);
  });

  test('coerces the raw store value to a boolean', () => {
    expect(getPreviewFeatureValue({ view: { systemConfig: { previewFeatures: { my_feature: 'yes' } } } }, 'my_feature')).toBe(true);
  });

  test('does not throw for an unrecognized key, unlike getFeatureFlagValue', () => {
    expect(() => getPreviewFeatureValue({}, 'not_a_registered_flag')).not.toThrow();
  });
});
