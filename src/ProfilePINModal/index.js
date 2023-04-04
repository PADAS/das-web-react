import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import PropTypes from 'prop-types';
import PinField from 'react-pin-field';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';

import styles from './styles.module.scss';

const { Header, Title, Body } = Modal;
const { Label } = Form;


const PIN_VALIDATION_RULES = /^[0-9]$/;
const PIN_LENGTH = 4;

const ConfirmationCheck = () => <svg className={styles.checkmark} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
  <circle className={styles.checkmark__circle} cx="26" cy="26" r="25" fill="none"/>
  <path className={styles.checkmark__check} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
</svg>;

const ProfilePINModal = ({ onSuccess, profile }) => {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const pinInputsRef = useRef(null);

  const onChange = useCallback(() => {
    if (!error) return;

    setError(null);
  }, [error]);

  const onFailure = useCallback(() => {
    setError(true);
  }, []);

  const onComplete = useCallback((pin) => {
    if (pin !== profile.pin.toString()) {
      return onFailure();
    }

    setSuccess(true);

    return onSuccess();
  }, [onFailure, onSuccess, profile?.pin]);

  useEffect(() => {
    setTimeout(() => {
      pinInputsRef?.current?.[0]?.focus();
    });
  }, []);

  return <>
    <Header closeButton>
      <Title>Enter Your PIN</Title>
    </Header>
    <Body>
      <Form>
        <Label>User: {profile.username}</Label>
        <fieldset className={styles.pinFields}>
          <PinField
          length={PIN_LENGTH}
          onChange={onChange}
          onComplete={onComplete}
          ref={pinInputsRef}
          role='input'
          validate={PIN_VALIDATION_RULES}
          />
          {success && <ConfirmationCheck />}
        </fieldset>
        {error && <p className={styles.error}>Incorrect PIN</p>}
      </Form>
    </Body>
  </>;
};

ProfilePINModal.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  profile: PropTypes.shape({
    username: PropTypes.string.isRequired,
    pin: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }).isRequired,
};


export default memo(ProfilePINModal);