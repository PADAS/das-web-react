import React, { memo, useCallback } from 'react';
import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { useDispatch } from 'react-redux';

import { setIsPickingLocation } from '../../ducks/map-ui';

import styles from './styles.module.scss';

const Footer = ({ disableSaveButton, onSave }) => {
  const dispatch = useDispatch();

  const onClickCancel = useCallback(() => {
    dispatch(setIsPickingLocation(false));
  }, [dispatch]);

  return <div className={styles.footer}>
    <Button className={styles.cancelButton} onClick={onClickCancel} type="button" variant="secondary">
      Cancel
    </Button>

    <OverlayTrigger
      placement="top"
      overlay={(props) => disableSaveButton ? <Tooltip {...props}>Only closed shapes can be saved</Tooltip> : <div />}
    >
      {/* Custom disable styles since Bootstrap OverlayTrigger component stops working (this is a known issue) */}
      <Button
        className={`${styles.saveButton} ${disableSaveButton ? styles.disabled : ''}`}
        onClick={!disableSaveButton ? onSave : null}
        type="button"
      >
        Save
      </Button>
    </OverlayTrigger>
  </div>;
};

export default memo(Footer);
