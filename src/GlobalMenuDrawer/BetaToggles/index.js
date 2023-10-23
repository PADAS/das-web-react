import React, { memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { BETA_PREVIEW_CATEGORY, trackEventFactory } from '../../utils/analytics';
import { setFlagOverrideValue } from '../../ducks/feature-flag-overrides';

const tracker = trackEventFactory(BETA_PREVIEW_CATEGORY);

const BetaToggles = () => {
  const dispatch = useDispatch();

  const toggleableFeatures = useSelector(
    (state) => Object.entries(state.view.featureFlagOverrides).filter(([key]) => key !== '_persist')
  );

  const onFlagOverrideToggle = useCallback((event) => {
    const { checked, value } = event.target;
    dispatch(setFlagOverrideValue(value, checked));

    const toggledLabel = toggleableFeatures.find(([flag]) => flag === value)[1].label;
    tracker.track(toggledLabel, `Turned ${checked ? 'On' : 'Off'}`);
  }, [dispatch, toggleableFeatures]);

  return <ul>
    {toggleableFeatures.map(([key, { label, value }]) =>
      <li key={key}>
        <label>
          <input type="checkbox" checked={value}
      data-testid={`beta-toggle-${key}`}
      key={key}
      label={label}
      onChange={onFlagOverrideToggle}
      value={key} />
          <span>{label}</span>
        </label>
      </li>
    )}
  </ul>;
};

export default memo(BetaToggles);
