import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Popover from 'react-bootstrap/Popover';
import Form from 'react-bootstrap/Form';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

import { trackEventFactory, BETA_PREVIEW_CATEGORY  } from '../../utils/analytics';

import { setFlagOverrideValue } from '../../ducks/feature-flag-overrides';

import { ReactComponent as InfoIcon } from '../../common/images/icons/information.svg';

import styles from './styles.module.scss';

const tracker = trackEventFactory(BETA_PREVIEW_CATEGORY);

const BetaToggles = () => {
  const toggleableFeatures = useSelector((state) =>
    Object.entries(state.view.featureFlagOverrides)
      .filter(([key]) => key !== '_persist')
  );
  const dispatch = useDispatch();


  const onFlagOverrideToggle = useCallback(({ target: { checked, value } }) => {
    const toggledLabel = toggleableFeatures.find(([flag]) =>
      flag === value
    )[1].label;

    console.log(toggledLabel, `Turned ${checked ? 'On' : 'Off'}`);

    tracker.track(toggledLabel, `Turned ${checked ? 'On' : 'Off'}`);

    dispatch(
      setFlagOverrideValue(value, checked)
    );
  }, [dispatch, toggleableFeatures]);

  return <Form>
    <h6 className={styles.formTitle}>BETA PREVIEWS <OverlayTrigger
        rootClose
        placement="right"
        overlay={
          <Popover className={styles.popover}>
            <p>
              Use the toggles below to preview and test soon-to-be-released EarthRanger functionality.
            </p>
            <small>These features are in a pre-release stage, and may not always work as expected. Please reach out and contact support with any concerns, feedback, and suggestions.</small>
          </Popover>
        }>
      <button type="button" className={styles.infoButton}>
        <InfoIcon className={styles.infoIcon} />
      </button>
    </OverlayTrigger>
    </h6>

    {toggleableFeatures.map(([key, { label, value }]) =>
      <Form.Check
      data-testid={`beta-toggle-${key}`}
      key={key}
      type="switch"
      checked={value}
      onChange={onFlagOverrideToggle}
      value={key}
      label={label} />
    )}


  </Form>;
};

export default BetaToggles;