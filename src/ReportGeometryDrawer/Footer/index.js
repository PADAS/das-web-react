import React, { memo, useCallback } from 'react';
import Button from 'react-bootstrap/Button';
import { useDispatch } from 'react-redux';

import { setMapInteractionIsPickingArea } from '../../ducks/map-ui';

import styles from './styles.module.scss';

const Footer = ({ disableSaveButton, onSave }) => {
  const dispatch = useDispatch();

  const onClickCancel = useCallback(() => {
    dispatch(setMapInteractionIsPickingArea(false));
  }, [dispatch]);

  return <div className={styles.footer}>
    <Button className={styles.cancelButton} onClick={onClickCancel} type="button" variant="secondary">
      Cancel
    </Button>

    <Button className={styles.saveButton} disabled={disableSaveButton} onClick={onSave} type="button">
      Save
    </Button>
  </div>;
};

export default memo(Footer);
