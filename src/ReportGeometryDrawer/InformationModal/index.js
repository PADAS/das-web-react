import React, { memo } from 'react';
import Modal from 'react-bootstrap/Modal';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import styles from './styles.module.scss';

const InformationModal = ({ onHide, show }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'reportGeometryDrawer.informationModal' });

  return <Modal onHide={onHide} show={show}>
    <Modal.Header closeButton>
      <Modal.Title>{t('modalTitle')}</Modal.Title>
    </Modal.Header>

    <Modal.Body className={styles.body}>
      <h3>{t('reportAreaHeader')}</h3>
      <p>{t('reportAreaContent')}</p>

      <h3>{t('addingPointsHeader')}</h3>
      <p>{t('addingPointsContent')}</p>

      <h3>{t('closingAreaHeader')}</h3>
      <p>{t('closingAreaContent')}</p>

      <h3>{t('deletingPointsHeader')}</h3>
      <p>{t('deletingPointsContent')}</p>

      <h3>{t('addingPointsToExistingAreaHeader')}</h3>
      <p>{t('addingPointsToExistingAreaContent')}</p>
    </Modal.Body>
  </Modal>;
};

InformationModal.propTypes = {
  onHide: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
};

export default memo(InformationModal);
