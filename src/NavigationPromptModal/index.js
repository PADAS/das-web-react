import React, { memo, useCallback } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import PropTypes from 'prop-types';

import { ReactComponent as TrashCanIcon } from '../common/images/icons/trash-can.svg';

import { BLOCKER_STATES } from '../NavigationContextProvider';
import useNavigationBlocker from '../hooks/useNavigationBlocker';

import styles from './styles.module.scss';

const NavigationPromptModal = ({
  cancelNavigationButtonText,
  continueNavigationNegativeButtonText,
  continueNavigationPositiveButtonText,
  description,
  onCancel,
  onContinue,
  title,
  when,
  ...rest
}) => {
  const blocker = useNavigationBlocker(when);

  const handleCancel = useCallback(async () => {
    await onCancel?.();

    blocker.reset();
  }, [blocker, onCancel]);

  const handlePositiveContinue = useCallback(async () => {
    await onContinue?.(true);

    blocker.proceed();
  }, [blocker, onContinue]);

  const handleNegativeContinue = useCallback(async () => {
    await onContinue?.(false);

    blocker.proceed();
  }, [blocker, onContinue]);

  return <Modal show={blocker.state === BLOCKER_STATES.BLOCKED} {...rest} onHide={handleCancel}>
    <Modal.Header closeButton>
      <Modal.Title>{title}</Modal.Title>
    </Modal.Header>

    <Modal.Body>{description}</Modal.Body>

    <Modal.Footer className={styles.footer}>
      <Button className={styles.cancelButton} onClick={handleCancel} variant="secondary">
        {cancelNavigationButtonText}
      </Button>

      <Button
        className={styles.negativeContinue}
        onClick={handleNegativeContinue}
        variant="primary"
      >
        <TrashCanIcon />
        {continueNavigationNegativeButtonText}
      </Button>

      <Button
        className={styles.positiveContinue}
        onClick={handlePositiveContinue}
        data-testid='navigation-prompt-positive-continue-btn'
        variant="primary"
      >
        {continueNavigationPositiveButtonText}
      </Button>
    </Modal.Footer>
  </Modal>;
};

NavigationPromptModal.defaultProps = {
  cancelNavigationButtonText: 'Go Back',
  continueNavigationNegativeButtonText: 'Discard',
  continueNavigationPositiveButtonText: 'Save',
  description: 'There are unsaved changes. Would you like to go back, discard the changes, or save and continue?',
  onCancel: null,
  onContinue: null,
  title: 'Unsaved Changes',
};

NavigationPromptModal.propTypes = {
  cancelNavigationButtonText: PropTypes.string,
  continueNavigationNegativeButtonText: PropTypes.string,
  continueNavigationPositiveButtonText: PropTypes.string,
  description: PropTypes.string,
  onCancel: PropTypes.func,
  onContinue: PropTypes.func,
  title: PropTypes.string,
  when: PropTypes.bool.isRequired,
};

export default memo(NavigationPromptModal);
