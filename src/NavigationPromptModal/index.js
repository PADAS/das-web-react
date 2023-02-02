import React, { memo } from 'react';
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
  title,
  when,
  ...rest
}) => {
  const blocker = useNavigationBlocker(when);

  return <Modal {...rest} onHide={blocker.reset} show={blocker.state === BLOCKER_STATES.BLOCKED}>
    <Modal.Header closeButton>
      <Modal.Title>{title}</Modal.Title>
    </Modal.Header>

    <Modal.Body>{description}</Modal.Body>

    <Modal.Footer className={styles.footer}>
      <Button className={styles.cancelButton} onClick={blocker.reset} variant="secondary">
        {cancelNavigationButtonText}
      </Button>

      <Button
        className={styles.continueButton}
        onClick={blocker.proceed}
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
  title: 'Discard changes',
};

NavigationPromptModal.propTypes = {
  cancelNavigationButtonText: PropTypes.string,
  continueNavigationButtonText: PropTypes.string,
  description: PropTypes.string,
  title: PropTypes.string,
  when: PropTypes.bool.isRequired,
};

export default memo(NavigationPromptModal);