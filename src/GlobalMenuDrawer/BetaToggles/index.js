import React, { memo, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { BETA_PREVIEW_CATEGORY, trackEventFactory } from '../../utils/analytics';
import { setFlagOverrideValue } from '../../ducks/feature-flag-overrides';


const tracker = trackEventFactory(BETA_PREVIEW_CATEGORY);

const BetaToggles = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('ducks', { keyPrefix: 'featureFlagLabels' });

  const toggleableFeatures = useSelector(
    (state) => Object.entries(state.view.featureFlagOverrides).filter(([key]) => key !== '_persist')
  );

  const translatedToggleableFeatures = useMemo(() => toggleableFeatures.map(([label, feature]) => ([
    label,
    {
      ...feature,
      label: t(feature.labelKey)
    }
  ])), [t, toggleableFeatures]);

  const onFlagOverrideToggle = useCallback((event) => {
    const { checked, value } = event.target;
    dispatch(setFlagOverrideValue(value, checked));

    const toggledLabel = translatedToggleableFeatures.find(([flag]) => flag === value)[1].label;
    tracker.track(toggledLabel, `Turned ${checked ? 'On' : 'Off'}`);
  }, [dispatch, translatedToggleableFeatures]);

  return <ul>
    {translatedToggleableFeatures.map(([key, { label, value }]) =>
      <li key={key}>
        <label>
          <input
            checked={value}
            data-testid={`beta-toggle-${key}`}
            label={label}
            onChange={onFlagOverrideToggle}
            type="checkbox"
            value={key}
          />

          <span>{label}</span>
        </label>
      </li>
    )}
  </ul>;
};

export default memo(BetaToggles);
