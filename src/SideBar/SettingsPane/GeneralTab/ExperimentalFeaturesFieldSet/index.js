import React, { Fragment, useMemo } from 'react';
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

  const experimentalFeatures = useSelector((state) => state.view.experimentalFeatures);

  // Calculate the experimental feature checkboxes to show from the store and
  // from "ef" query parameter.
  const experimentalFeatureCheckboxesToShow = useMemo(() => {
    // Experimental features that are already enabled from the store that still
    // are valid development feature flags.
    const validExperimentalFeaturesFromStore = Object.entries(experimentalFeatures)
      .reduce((accumulator, [featureKey]) => {
        if (featureKey in DEVELOPMENT_FEATURE_FLAGS) {
          accumulator.push(featureKey);
        }
        return accumulator;
      }, []);
    // Experimental features that come in the "ef" query parameter that are
    // valid development feature flags.
    const validExperimentalFeaturesFromQueryParameter = (searchParams.get(EXPERIMENTA_FEATURES_QUERY_PARAMETER) || '')
      .split(',')
      .filter((featureKey) => featureKey in DEVELOPMENT_FEATURE_FLAGS);

    // Make sure each feature keys are unique by parsing into a set.
    return [
      ...new Set([
        ...validExperimentalFeaturesFromStore,
        ...validExperimentalFeaturesFromQueryParameter,
      ]),
    ];
  }, [experimentalFeatures, searchParams]);

  const onExperimentalFeatureCheckboxChange = (featureKey) => (event) => {
    dispatch(setExperimentalFeatures({ ...experimentalFeatures, [featureKey]: event.target.checked }));

    settingsTracker.track(`${event.target.checked ? 'Check' : 'Uncheck'} 'Experimental features: ${featureKey}' checkbox`);
  };

  if (experimentalFeatureCheckboxesToShow.length === 0) {
    return null;
  }
  return <fieldset className={styles.section}>
    <legend className={styles.title}>{t('legend')}</legend>

    <div className={styles.sectionWrapper}>
      {experimentalFeatureCheckboxesToShow.map((featureKey, index) => {
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

          {index < experimentalFeatureCheckboxesToShow.length - 1 && <hr className={styles.separator} />}
        </Fragment>;
      })}
    </div>
  </fieldset>;
};

export default ExperimentalFeaturesFieldSet;
