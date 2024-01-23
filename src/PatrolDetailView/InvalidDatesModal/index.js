import React, { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import PropTypes from 'prop-types';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const InvalidDatesModal = ({ onHide, show }) => {
  const onClickOk = useCallback(() => onHide(), [onHide]);
  const { t } = useTranslation('patrols', { keyPrefix: 'invalidDatesModal' });

  return <Modal onHide={onHide} show={show}>
    <Modal.Header closeButton>
      <Modal.Title>{t('title')}</Modal.Title>
    </Modal.Header>

    <Modal.Body>
      <p>{t('body')}</p>
    </Modal.Body>

    <Modal.Footer>
      <Button onClick={onClickOk} tabIndex={2} type="button" variant="primary">
        {t('okButton')}
      </Button>
    </Modal.Footer>
  </Modal>;
};

InvalidDatesModal.propTypes = {
  onHide: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
};

export default memo(InvalidDatesModal);
