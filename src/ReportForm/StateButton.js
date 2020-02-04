import React, { memo } from 'react';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';

const ACTIVE_STATES = ['active', 'new'];


const StateButton = (props) => {
  const { state, isCollection, onStateToggle, ...rest } = props;
  const isActive = ACTIVE_STATES.includes(state);

  const onClick = () => {
    onStateToggle(isActive ? 'resolved' : 'active');
  };

  return <Button type='button' variant='primary' onClick={onClick} {...rest}>
    {isActive ? 'Save and resolve' : 'Save and reopen'}
  </Button>;
};

export default memo(StateButton);

StateButton.propTypes = {
  isCollection: PropTypes.bool.isRequired,
  onStateToggle: PropTypes.func.isRequired,
  state: PropTypes.string.isRequired,
};