import React, { memo } from 'react';
import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

import styles from './styles.module.scss';

const Footer = ({ isDrawing, isGeometryAValidPolygon, onCancel, onSave }) => {
  const disableSaveButton = isDrawing || !isGeometryAValidPolygon;
  const tooltipText = isDrawing
    ? 'Only closed shapes can be saved'
    : 'Segments of the shape cannot intersect';

  return <div className={styles.footer}>
    <Button className={styles.cancelButton} onClick={onCancel} type="button" variant="secondary">
      Cancel
    </Button>

    <OverlayTrigger
      placement="top"
      overlay={(props) => disableSaveButton ? <Tooltip {...props}>{tooltipText}</Tooltip> : <div />}
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
