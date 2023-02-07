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
  continueNavigationButtonText,
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

  const handleContinue = useCallback(() => {
    blocker.proceed();

    onContinue?.();
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
        className={styles.continueButton}
        onClick={handleContinue}
        onFocus={(event) => event.target.blur()}
        variant="primary"
      >
        <TrashCanIcon />
        {continueNavigationButtonText}
      </Button>
    </Modal.Footer>
  </Modal>;
};

NavigationPromptModal.defaultProps = {
  cancelNavigationButtonText: 'Cancel',
  continueNavigationButtonText: 'Discard',
  description: 'Would you like to discard changes?',
  onCancel: null,
  onContinue: null,
  title: 'Discard changes',
};

NavigationPromptModal.propTypes = {
  cancelNavigationButtonText: PropTypes.string,
  continueNavigationButtonText: PropTypes.string,
  description: PropTypes.string,
  onCancel: PropTypes.func,
  onContinue: PropTypes.func,
  title: PropTypes.string,
  when: PropTypes.bool.isRequired,
};

export default memo(NavigationPromptModal);
