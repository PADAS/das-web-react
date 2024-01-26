import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import SplitButton from 'react-bootstrap/SplitButton';

import styles from './styles.module.scss';

const StateButton = (props) => {
  const { isActive, label, onStateToggle, ...rest } = props;

  const onClick = () => {
    onStateToggle(isActive ? 'resolved' : 'active');
  };

  return <Button type='button' variant='primary' onClick={onClick} {...rest}>
    {label}
  </Button>;
};

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
  const stateButtonLabel = t(isActiveState ? 'stateResolveButton' : 'stateReopenButton');
  const SaveButtonComponent = !!onStateToggle ? SplitButton : Button;

  return <div className={styles.formButtons}>
    <Button type="button" onClick={onCancel} variant="secondary">{cancelTitle}</Button>
    {!readonly && <SaveButtonComponent className={styles.saveButton} disabled={saveDisabled} drop='down' variant='primary' type='submit' title={t('saveButton')} onClick={onSave}>
      {!onStateToggle && t('saveButton')}
      {!!onStateToggle && <Dropdown.Item>
        <StateButton state={data.state} isActive={isActiveState} onStateToggle={onStateToggle} label={stateButtonLabel} />
      </Dropdown.Item>}
    </SaveButtonComponent>}
  </div>;
};

export default memo(Footer);

Footer.propTypes = {
  cancelTitle: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onStateToggle: PropTypes.func,
  data: PropTypes.object.isRequired,
  isActiveState: PropTypes.bool.isRequired,
};