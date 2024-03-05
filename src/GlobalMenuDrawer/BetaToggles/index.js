import React, { memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { BETA_PREVIEW_CATEGORY, trackEventFactory } from '../../utils/analytics';
import { FEATURE_FLAG_INPUT_LABELS, setFlagOverrideValue } from '../../ducks/feature-flag-overrides';

const tracker = trackEventFactory(BETA_PREVIEW_CATEGORY);

const BetaToggles = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('menu-drawer', { keyPrefix: 'betaToggles' });

  const toggleableFeatures = useSelector(
    (state) => Object.entries(state.view.featureFlagOverrides).filter(([key]) => key !== '_persist')
  );

  const onFlagOverrideToggle = useCallback((event) => {
    const { checked, value } = event.target;
    dispatch(setFlagOverrideValue(value, checked));

    tracker.track(t(FEATURE_FLAG_INPUT_LABELS[value], { lng: 'en-US' }), `Turned ${checked ? 'On' : 'Off'}`);
  }, [dispatch, t]);

  return <ul>
    {toggleableFeatures.map(([key, { value }]) =>
      <li key={key}>
        <label>
          <input
            checked={value}
            data-testid={`beta-toggle-${key}`}
            label={t(FEATURE_FLAG_INPUT_LABELS[key])}
            onChange={onFlagOverrideToggle}
            type="checkbox"
            value={key}
          />

          <span>{t(FEATURE_FLAG_INPUT_LABELS[key])}</span>
        </label>
      </li>
    )}
  </ul>;
};

export default memo(BetaToggles);
