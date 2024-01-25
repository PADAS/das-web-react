import React, { memo, useCallback } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { ReactComponent as TrashCanIcon } from '../common/images/icons/trash-can.svg';

import { BLOCKER_STATES } from '../NavigationContextProvider';
import useNavigationBlocker from '../hooks/useNavigationBlocker';

import styles from './styles.module.scss';

const NavigationPromptModal = ({
  onCancel,
  onContinue,
  when,
  ...restProps
}) => {
  const blocker = useNavigationBlocker(when);
  const { t } = useTranslation('details-view', { keyPrefix: 'navigationPromptModal' });
  const {
    cancelNavigationButtonText = t('cancelNavigationButtonText'),
    continueNavigationNegativeButtonText = t('continueNavigationNegativeButtonText'),
    continueNavigationPositiveButtonText = t('continueNavigationPositiveButtonText'),
    description = t('description'),
    title = t('title')
  } = restProps;

  const handleCancel = useCallback(async () => {
    await onCancel?.();

    blocker.reset();
  }, [blocker, onCancel]);

  const handlePositiveContinue = useCallback(async () => {
    const canContinue = await onContinue?.(true);
    canContinue ? blocker.proceed() : blocker.reset();
  }, [blocker, onContinue]);

  const handleNegativeContinue = useCallback(async () => {
    await onContinue?.(false);

    blocker.proceed();
  }, [blocker, onContinue]);

  return <Modal show={blocker.state === BLOCKER_STATES.BLOCKED} {...restProps} onHide={handleCancel}>
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
  onCancel: null,
  onContinue: null,
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
