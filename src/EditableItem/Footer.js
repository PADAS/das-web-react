import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import SplitButton from 'react-bootstrap/SplitButton';

import { EVENT_FORM_STATES } from '../constants';

import * as styles from './styles.module.scss';

const StateButton = ({ label, onStateToggle, targetState, ...rest }) => (
  <Button type='button' variant='primary' onClick={() => onStateToggle(targetState)} {...rest}>
    {label}
  </Button>
);

const Footer = ({
  onCancel,
  readonly,
  onSave,
  onStateToggle,
  data,
  isActiveState,
  saveDisabled,
  ...restProps
}) => {
  const { t } = useTranslation('details-view', { keyPrefix: 'footer' });
  const { cancelTitle = t('cancelButton') } = restProps;
  const SaveButtonComponent = !!onStateToggle ? SplitButton : Button;
  const isInReview = data?.state === EVENT_FORM_STATES.REVIEW;

  return <div className={styles.formButtons}>
    <Button type="button" onClick={onCancel} variant="secondary">{cancelTitle}</Button>
    {!readonly && <SaveButtonComponent className={styles.saveButton} disabled={saveDisabled} drop='down' variant='primary' type='submit' title={t('saveButton')} onClick={onSave}>
      {!onStateToggle && t('saveButton')}
      {!!onStateToggle && <>
        {isActiveState && <Dropdown.Item>
          <StateButton
            targetState={EVENT_FORM_STATES.RESOLVED}
            onStateToggle={onStateToggle}
            label={t('stateResolveButton')}
          />
        </Dropdown.Item>}
        {isInReview && <>
          <Dropdown.Item>
            <StateButton
              targetState={EVENT_FORM_STATES.RESOLVED}
              onStateToggle={onStateToggle}
              label={t('stateResolveButton')}
            />
          </Dropdown.Item>
          <Dropdown.Item>
            <StateButton
              targetState={EVENT_FORM_STATES.ACTIVE}
              onStateToggle={onStateToggle}
              label={t('stateActivateButton')}
            />
          </Dropdown.Item>
        </>}
        {!isActiveState && !isInReview && <Dropdown.Item>
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
