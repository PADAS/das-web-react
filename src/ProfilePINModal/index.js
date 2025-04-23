import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import PinField from 'react-pin-field';
import { useTranslation } from 'react-i18next';

import ConfirmationCheck from '../ConfirmationCheck';

import * as styles from './styles.module.scss';

const PIN_LENGTH = 4;
const PIN_VALIDATION_RULES = '[0-9]';

const ProfilePINModal = ({ onSuccess, profile }) => {
  const { t } = useTranslation('top-bar', { keyPrefix: 'profilePINModal' });

  const pinInputsRef = useRef(null);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const onChange = useCallback(() => {
    if (error) {
      setError(null);
    }
  }, [error]);

  const onComplete = useCallback((pin) => {
    if (pin !== profile.pin.toString()) {
      return setError(true);
    }

    setSuccess(true);

    return onSuccess();
  }, [onSuccess, profile?.pin]);

  useEffect(() => {
    setTimeout(() => {
      pinInputsRef?.current?.[0]?.focus();
    });
  }, []);

  return <>
    <Modal.Header closeButton>
      <Modal.Title>{t('title')}</Modal.Title>
    </Modal.Header>

    <Modal.Body className={styles.modalBody}>
      <Form>
        <Form.Label>{`${t('userLabel')}${profile.username}`}</Form.Label>

        <fieldset className={styles.pinFields}>
          <PinField
            length={PIN_LENGTH}
            onChange={onChange}
            onComplete={onComplete}
            pattern={PIN_VALIDATION_RULES}
            ref={pinInputsRef}
            role="input"
            type="password"
          />

          {success && <ConfirmationCheck />}
        </fieldset>

        {error && <p className={styles.error}>{t('error')}</p>}
      </Form>
    </Modal.Body>
  </>;
};

export default memo(ProfilePINModal);
