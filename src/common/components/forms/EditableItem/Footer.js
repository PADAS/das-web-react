import React, { memo } from 'react';
import PropTypes from 'prop-types';

import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import SplitButton from 'react-bootstrap/SplitButton';

import styles from './styles.module.scss';

const StateButton = (props) => {
  const { isActive, onStateToggle, saveDisabled, ...rest } = props;

  const onClick = () => {
    onStateToggle(isActive ? 'resolved' : 'active');
  };

  return <Button type='button' variant='primary' onClick={onClick} {...rest}>
    {isActive ? 'Save and resolve' : 'Save and reopen'}
  </Button>;
};

const Footer = (props) => {
  const { onCancel, readonly, cancelTitle = 'Cancel', onSave, onStateToggle, data, isActiveState, saveDisabled } = props;

  const SaveButtonComponent = !!onStateToggle ? SplitButton : Button;

  return <div className={styles.formButtons}>
    <Button type="button" onClick={onCancel} variant="secondary">{cancelTitle}</Button>
    {!readonly && <SaveButtonComponent className={styles.saveButton} disabled={saveDisabled} drop='down' variant='primary' type='submit' title='Save' onClick={onSave}>
      {!onStateToggle && 'Save'}
      {!!onStateToggle && <Dropdown.Item>
        <StateButton state={data.state} isActive={isActiveState} onStateToggle={onStateToggle} />
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