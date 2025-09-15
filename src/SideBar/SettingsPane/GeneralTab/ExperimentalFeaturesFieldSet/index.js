import React, { Fragment, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';

import { DEVELOPMENT_FEATURE_FLAGS } from '../../../../constants';
import { setExperimentalFeatures } from '../../../../ducks/experimental-features';
import { SETTINGS_CATEGORY, trackEventFactory } from '../../../../utils/analytics';

import * as styles from '../../styles.module.scss';

const settingsTracker = trackEventFactory(SETTINGS_CATEGORY);

export const EXPERIMENTA_FEATURES_QUERY_PARAMETER = 'ef';

const ExperimentalFeaturesFieldSet = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation('components', { keyPrefix: 'sideBar.settingsPane.generalTab.experimentalFeaturesFieldSet' });

  const experimentalFeatures = useSelector((state) => state.view.experimentalFeatures) || {};

  // If an experimental feature was already set in the store or its key comes
  // in the "ef" query parameter, we show their checkboxes as long as they are
  // valid development feature flags.
  const validExperimentalFeaturesFromStore = Object.entries(experimentalFeatures)
    .reduce((accumulator, [featureKey]) => {
      if (featureKey in DEVELOPMENT_FEATURE_FLAGS) {
        accumulator.push(featureKey);
      }
      return accumulator;
    }, []);
  const validExperimentalFeaturesFromQueryParameter = (searchParams.get(EXPERIMENTA_FEATURES_QUERY_PARAMETER) || '')
    .split(',')
    .filter((featureKey) => featureKey in DEVELOPMENT_FEATURE_FLAGS);

  // Store the experimental features to show in a ref so the value stays
  // constant over re-renders. Otherwise, when a user unchecks a feature
  // enabled in the store, its checkbox would dissapear. Make sure items are
  // unique by transforming the array into a set and then back.
  const experimentalFeaturesToShowRef = useRef([
    ...new Set([
      ...validExperimentalFeaturesFromStore,
      ...validExperimentalFeaturesFromQueryParameter,
    ]),
  ]);

  const onExperimentalFeatureCheckboxChange = (featureKey) => (event) => {
    const newExperimentalFeatures = { ...experimentalFeatures, [featureKey]: event.target.checked };
    // Clean old entries in the experimental features store that are no longer
    // valid development feature flags.
    dispatch(
      setExperimentalFeatures(
        Object.fromEntries(
          Object.entries(newExperimentalFeatures).filter(([key]) => key in DEVELOPMENT_FEATURE_FLAGS)
        )
      )
    );

    settingsTracker.track(`${event.target.checked ? 'Check' : 'Uncheck'} 'Experimental features: ${featureKey}' checkbox`);
  };

  if (experimentalFeaturesToShowRef.current.length === 0) {
    return null;
  }
  return <fieldset className={styles.section}>
    <legend className={styles.title}>{t('legend')}</legend>

    <div className={styles.sectionWrapper}>
      {experimentalFeaturesToShowRef.current.map((featureKey, index) => {
        const isChecked = featureKey in experimentalFeatures
          ? experimentalFeatures[featureKey]
          : DEVELOPMENT_FEATURE_FLAGS[featureKey];

        return <Fragment key={featureKey}>
          <div className={styles.checkboxWrapper}>
            <input
              checked={isChecked}
              className={styles.checkbox}
              id={`general-experimental-features-${featureKey}`}
              onChange={onExperimentalFeatureCheckboxChange(featureKey)}
              type="checkbox"
            />

            <label className={styles.label} htmlFor={`general-experimental-features-${featureKey}`}>
              {t(featureKey)}
            </label>
          </div>

          {index < experimentalFeaturesToShowRef.current.length - 1 && <hr className={styles.separator} />}
        </Fragment>;
      })}
    </div>
  </fieldset>;
};

export default ExperimentalFeaturesFieldSet;
