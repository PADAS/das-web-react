import React, { memo } from 'react';
import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import PropTypes from 'prop-types';
import Tooltip from 'react-bootstrap/Tooltip';
import { useTranslation } from 'react-i18next';

import styles from './styles.module.scss';

const Footer = ({ isDrawing, isGeometryAValidPolygon, onCancel, onSave }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'reportGeometryDrawer' });

  const disableSaveButton = isDrawing || !isGeometryAValidPolygon;

  return <div className={styles.footer}>
    <Button className={styles.cancelButton} onClick={onCancel} type="button" variant="secondary">
      {t('footer.cancelButton')}
    </Button>

    <OverlayTrigger
      placement="top"
      overlay={(props) => disableSaveButton
        ? <Tooltip {...props}>{t(`footer.saveButtonTooltip.${isDrawing ? 'drawing' : 'invalidGeometry'}`)}</Tooltip>
        : <div />}
    >
      <Button
        className={`${styles.saveButton} ${disableSaveButton ? styles.disabled : ''}`}
        onClick={!disableSaveButton ? onSave : null}
        type="button"
      >
        {t('footer.saveButton')}
      </Button>
    </OverlayTrigger>
  </div>;
};

Footer.propTypes = {
  isDrawing: PropTypes.bool.isRequired,
  isGeometryAValidPolygon: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default memo(Footer);
