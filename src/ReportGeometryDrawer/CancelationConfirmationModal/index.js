import React, { memo, useContext } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { MapDrawingToolsContext } from '../../MapDrawingTools/ContextProvider';
import { setIsPickingLocation } from '../../ducks/map-ui';

import styles from './styles.module.scss';

const CancelationConfirmationModal = ({ onHide, show }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('reports', { keyPrefix: 'reportGeometryDrawer' });

  const { setMapDrawingData } = useContext(MapDrawingToolsContext);

  const onClickDiscard = () => {
    setMapDrawingData(null);
    dispatch(setIsPickingLocation(false));
    onHide();
  };

  return <Modal onHide={onHide} show={show}>
    <Modal.Header closeButton>
      <Modal.Title>{t('cancelationConfirmationModal.modalTitle')}</Modal.Title>
    </Modal.Header>

    <Modal.Body>
      <p className={styles.message}>
        {t('cancelationConfirmationModal.modalBody')}
      </p>

      <div className={styles.buttons}>
        <Button
          className={styles.continueEditingButton}
          data-testid="reportGeometryDrawer-cancelatinConfirmationModal-discardButton"
          onClick={() => onHide()}
          type="button"
          variant="secondary"
        >
          {t('cancelationConfirmationModal.continueEditingButton')}
        </Button>

        <Button
          className={styles.discardButton}
          onClick={onClickDiscard}
          type="button"
          variant="secondary"
        >
          {t('cancelationConfirmationModal.discardButton')}
        </Button>
      </div>
    </Modal.Body>
  </Modal>;
};

CancelationConfirmationModal.propTypes = {
  onHide: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
};

export default memo(CancelationConfirmationModal);
