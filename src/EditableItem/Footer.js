import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import SplitButton from 'react-bootstrap/SplitButton';

import { EVENT_FORM_STATES } from '../constants';
import { isReportActive } from '../utils/events';

import * as styles from './styles.module.scss';

const StateButton = ({ label, onStateToggle, targetState, ...rest }) => (
  <Button className={styles.stateButton} type='button' variant='primary' onClick={() => onStateToggle(targetState)} {...rest}>
    {label}
  </Button>
);

const Footer = ({
  onCancel,
  readonly,
  onSave,
  onStateToggle,
  data,
  saveDisabled,
  ...restProps
}) => {
  const { t } = useTranslation('details-view', { keyPrefix: 'footer' });
  const { cancelTitle = t('cancelButton') } = restProps;

  // Remove this flag and the conditional rendering below once community input
  // is enabled for all tenants.
  const communityInputEnabled = useSelector(
    (state) => !!state.view.systemConfig.previewFeatures?.community_input_admin_enabled
  );

  const isActive = isReportActive(data);
  const isInReview = data?.state === EVENT_FORM_STATES.REVIEW;
  const SaveButtonComponent = onStateToggle ? SplitButton : Button;

  return <div className={styles.formButtons}>
    <Button type="button" onClick={onCancel} variant="secondary">{cancelTitle}</Button>
    {!readonly && <SaveButtonComponent className={styles.saveButton} disabled={saveDisabled} drop='down' variant='primary' type='submit' title={t('saveButton')} onClick={onSave}>
      {!onStateToggle && t('saveButton')}
      {!!onStateToggle && <>
        {(isActive || isInReview) && <Dropdown.Item>
          <StateButton
            targetState={EVENT_FORM_STATES.RESOLVED}
            onStateToggle={onStateToggle}
            label={t('stateResolveButton')}
          />
        </Dropdown.Item>}
        {isActive && communityInputEnabled && <Dropdown.Item>
          <StateButton
            targetState={EVENT_FORM_STATES.REVIEW}
            onStateToggle={onStateToggle}
            label={t('stateReviewButton')}
          />
        </Dropdown.Item>}
        {isInReview && <Dropdown.Item>
          <StateButton
            targetState={EVENT_FORM_STATES.ACTIVE}
            onStateToggle={onStateToggle}
            label={t('stateActivateButton')}
          />
        </Dropdown.Item>}
        {!isActive && !isInReview && <Dropdown.Item>
          <StateButton
            targetState={EVENT_FORM_STATES.ACTIVE}
            onStateToggle={onStateToggle}
            label={t('stateReopenButton')}
          />
        </Dropdown.Item>}
      </>}
    </SaveButtonComponent>}
  </div>;
};

export default memo(Footer);
