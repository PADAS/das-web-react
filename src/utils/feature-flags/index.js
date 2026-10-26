import { DEVELOPMENT_FEATURE_FLAGS } from '../../constants';

export const getFeatureFlagValue = (state, flagName) => {
  if (!Object.hasOwn(DEVELOPMENT_FEATURE_FLAGS, flagName)) {
    throw new Error('no feature flag with that name exists');
  }

  const experimentalFeatures = state?.view?.experimentalFeatures || {};
  return flagName in experimentalFeatures
    ? experimentalFeatures[flagName]
    : DEVELOPMENT_FEATURE_FLAGS[flagName];
};

export const getPreviewFeatureValue = (state, featureKey) =>
  !!state?.view?.systemConfig?.previewFeatures?.[featureKey];
