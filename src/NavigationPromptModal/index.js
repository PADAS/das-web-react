import React, { memo, useCallback } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import PropTypes from 'prop-types';

import { ReactComponent as TrashCanIcon } from '../common/images/icons/trash-can.svg';

import { BLOCKER_STATES } from '../NavigationContextProvider';
import useNavigationBlocker from '../hooks/useNavigationBlocker';

import styles from './styles.module.scss';

const handleContinue = (blocker, onContinue, positive = false) => {
  blocker.proceed();

  onContinue?.(positive);
};

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

  const handleCancel = useCallback(() => {
    blocker.reset();

    onCancel?.();
  }, [blocker, onCancel]);

  const handlePositiveContinue = useCallback(() =>
    handleContinue(blocker, onContinue, true)
  , [blocker, onContinue]);

  const handleNegativeContinue = useCallback(() =>
    handleContinue(blocker, onContinue, false)
  , [blocker, onContinue]);

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
        onFocus={(event) => event.target.blur()}
        variant="primary"
      >
        <TrashCanIcon />
        {continueNavigationNegativeButtonText}
      </Button>

      <Button
        className={styles.positiveContinue}
        onClick={handlePositiveContinue}
        data-testid='navigation-prompt-positive-continue-btn'
        onFocus={(event) => event.target.blur()}
        variant="primary"
      >
        <TrashCanIcon />
        {continueNavigationPositiveButtonText}
      </Button>
    </Modal.Footer>
  </Modal>;
};

NavigationPromptModal.defaultProps = {
  cancelNavigationButtonText: 'Go Back',
  continueNavigationNegativeButtonText: 'Discard',
  continueNavigationPositiveButtonText: 'Save',
  description: 'You have unsaved changes. Would you like to go back and review them, discard them, or save them?',
  onCancel: null,
  onContinue: null,
  title: 'Unsaved Changes',
};

NavigationPromptModal.propTypes = {
  cancelNavigationButtonText: PropTypes.string,
  continueNavigationNegativeButtonText: PropTypes.string,
  description: PropTypes.string,
  onCancel: PropTypes.func,
  onContinue: PropTypes.func,
  title: PropTypes.string,
  when: PropTypes.bool.isRequired,
};

export default memo(NavigationPromptModal);
