import React, { memo } from 'react';
import PropTypes from 'prop-types';

import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import SplitButton from 'react-bootstrap/SplitButton';

import styles from './styles.module.scss';

const StateButton = (props) => {
  const { isActive, onStateToggle, ...rest } = props;

  const onClick = () => {
    onStateToggle(isActive ? 'resolved' : 'active');
  };

  return <Button type='button' variant='primary' onClick={onClick} {...rest}>
    {isActive ? 'Save and resolve' : 'Save and reopen'}
  </Button>;
};

const Footer = (props) => {
  const { onCancel, onSave, onStateToggle, data, isActiveState } = props;
  return <div className={styles.formButtons}>
    <Button type="button" onClick={onCancel} variant="secondary">Cancel</Button>
    <SplitButton className={styles.saveButton} drop='down' variant='primary' type='submit' title='Save' onClick={onSave}>
      <Dropdown.Item>
        <StateButton state={data.state} isActive={isActiveState} onStateToggle={onStateToggle} />
      </Dropdown.Item>
    </SplitButton>
  </div>;
};

export default memo(Footer);

Footer.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onStateToggle: PropTypes.func.isRequired,
  data: PropTypes.object.isRequired,
  isActiveState: PropTypes.bool.isRequired,
};