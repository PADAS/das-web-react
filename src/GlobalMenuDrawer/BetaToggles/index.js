import React, { memo, useCallback, useMemo } from 'react';
import Form from 'react-bootstrap/Form';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { useDispatch, useSelector } from 'react-redux';

import { ReactComponent as InfoIcon } from '../../common/images/icons/information.svg';

import { BETA_PREVIEW_CATEGORY, trackEventFactory } from '../../utils/analytics';
import { setFlagOverrideValue } from '../../ducks/feature-flag-overrides';

import styles from './styles.module.scss';

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

  const InfoPopover = useMemo(() => <Popover className={styles.popover}>
    <p>
      Use the toggles below to preview and test soon-to-be-released EarthRanger functionality.
    </p>
    <small>These features are in a pre-release stage, and may not always work as expected. Please reach out and contact support with any concerns, feedback, and suggestions.</small>
  </Popover>, []);

  return <Form>
    <h6 className={styles.formTitle}>
      BETA PREVIEWS

      <OverlayTrigger
        rootClose
        placement="right"
        overlay={InfoPopover}
      >
        <button type="button" className={styles.infoButton}>
          <InfoIcon className={styles.infoIcon} />
        </button>
      </OverlayTrigger>
    </h6>

    {toggleableFeatures.map(([key, { label, value }]) => <Form.Check
      checked={value}
      data-testid={`beta-toggle-${key}`}
      key={key}
      label={label}
      onChange={onFlagOverrideToggle}
      type="switch"
      value={key}
    />)}
  </Form>;
};

export default memo(BetaToggles);
