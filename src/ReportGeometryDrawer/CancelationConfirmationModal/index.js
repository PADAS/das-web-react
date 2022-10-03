import React, { memo, useCallback, useContext } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';

import { MapDrawingToolsContext } from '../../MapDrawingTools/ContextProvider';
import { setIsPickingLocation } from '../../ducks/map-ui';

import styles from './styles.module.scss';

const CancelationConfirmationModal = ({ onHide, show }) => {
  const dispatch = useDispatch();

  const { setMapDrawingData } = useContext(MapDrawingToolsContext);

  const onClickContinueEditing = useCallback(() => onHide(), [onHide]);

  const onClickDiscard = useCallback(() => {
    setMapDrawingData(null);
    dispatch(setIsPickingLocation(false));
    onHide();
  }, [dispatch, onHide, setMapDrawingData]);

  return <Modal onHide={onHide} show={show}>
    <Modal.Header closeButton>
      <Modal.Title>Discard Changes</Modal.Title>
    </Modal.Header>

    <Modal.Body>
      <p className={styles.message}>
        Canceling without saving will discard changes to the report area. Are you sure you want to discard changes?
      </p>

      <div className={styles.buttons}>
        <Button
          className={styles.continueEditingButton}
          data-testid="reportGeometryDrawer-cancelatinConfirmationModal-discardButton"
          onClick={onClickContinueEditing}
          type="button"
          variant="secondary"
        >
          Continue Editing
        </Button>

        <Button
          className={styles.discardButton}
          onClick={onClickDiscard}
          type="button"
          variant="secondary"
        >
          Discard
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
