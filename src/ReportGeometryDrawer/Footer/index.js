import React, { memo } from 'react';
import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

import styles from './styles.module.scss';

const Footer = ({ disableSaveButton, onCancel, onSave }) => <div className={styles.footer}>
  <Button className={styles.cancelButton} onClick={onCancel} type="button" variant="secondary">
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

export default memo(Footer);
