import React, { memo } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import PropTypes from 'prop-types';

import { ReactComponent as TrashCanIcon } from '../common/images/icons/trash-can.svg';

import useBlockNavigation from '../hooks/useBlockNavigation';

import styles from './styles.module.scss';

const NavigationPrompt = ({
  cancelNavigationButtonText,
  continueNavigationButtonText,
  description,
  title,
  when,
  ...rest
}) => {
  const { cancelNavigationAttempt, continueNavigationAttempt, isNavigationAttemptPending } = useBlockNavigation(when);

  return <Modal {...rest} onHide={cancelNavigationAttempt} show={isNavigationAttemptPending}>
    <Modal.Header closeButton>
      <Modal.Title>{title}</Modal.Title>
    </Modal.Header>

    <Modal.Body>{description}</Modal.Body>

    <Modal.Footer className={styles.footer}>
      <Button className={styles.cancelButton} onClick={cancelNavigationAttempt} variant="secondary">
        {cancelNavigationButtonText}
      </Button>

      <Button
        className={styles.continueButton}
        onClick={continueNavigationAttempt}
        onFocus={(event) => event.target.blur()}
        variant="primary"
      >
        <TrashCanIcon />
        {continueNavigationButtonText}
      </Button>
    </Modal.Footer>
  </Modal>;
};

NavigationPrompt.defaultProps = {
  cancelNavigationButtonText: 'Cancel',
  continueNavigationButtonText: 'Discard',
  description: 'Would you like to discard changes?',
  title: 'Discard changes',
};

NavigationPrompt.propTypes = {
  cancelNavigationButtonText: PropTypes.string,
  continueNavigationButtonText: PropTypes.string,
  description: PropTypes.string,
  title: PropTypes.string,
};

export default memo(NavigationPrompt);
