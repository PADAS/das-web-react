import React, { memo, useCallback, useContext } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { useDispatch } from 'react-redux';

import { MapDrawingToolsContext } from '../../MapDrawingTools/ContextProvider';
import { removeModal } from '../../ducks/modals';
import { setIsPickingLocation } from '../../ducks/map-ui';

import styles from './styles.module.scss';

const { Header, Title, Body } = Modal;

const CancelationConfirmationModal = ({ id }) => {
  const dispatch = useDispatch();

  const { setMapDrawingData } = useContext(MapDrawingToolsContext);

  const onClickContinueEditing = useCallback(() => {
    dispatch(removeModal(id));
  }, [dispatch, id]);

  const onClickDiscard = useCallback(() => {
    setMapDrawingData(null);
    dispatch(setIsPickingLocation(false));
    dispatch(removeModal(id));
  }, [dispatch, id, setMapDrawingData]);

  return <>
    <Header closeButton>
      <Title>Discard Report Area</Title>
    </Header>

    <Body>
      <p className={styles.message}>
        Are you sure you want to discard the report area?
      </p>

      <div className={styles.buttons}>
        <Button
          className={styles.continueEditingButton}
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
    </Body>
  </>;
};

export default memo(CancelationConfirmationModal);
