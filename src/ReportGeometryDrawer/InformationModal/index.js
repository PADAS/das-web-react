import React, { memo } from 'react';
import Modal from 'react-bootstrap/Modal';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import styles from './styles.module.scss';

const InformationModal = ({ onHide, show }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'reportGeometryDrawer' });

  return <Modal onHide={onHide} show={show}>
    <Modal.Header closeButton>
      <Modal.Title>{t('informationModal.modalTitle')}</Modal.Title>
    </Modal.Header>

    <Modal.Body className={styles.body}>
      <h3>{t('informationModal.reportAreaHeader')}</h3>
      <p>{t('informationModal.reportAreaContent')}</p>

      <h3>{t('informationModal.addingPointsHeader')}</h3>
      <p>{t('informationModal.addingPointsContent')}</p>

      <h3>{t('informationModal.closingAreaHeader')}</h3>
      <p>{t('informationModal.closingAreaContent')}</p>

      <h3>{t('informationModal.deletingPointsHeader')}</h3>
      <p>{t('informationModal.deletingPointsContent')}</p>

      <h3>{t('informationModal.addingPointsToExistingAreaHeader')}</h3>
      <p>{t('informationModal.addingPointsToExistingAreaContent')}</p>
    </Modal.Body>
  </Modal>;
};

InformationModal.propTypes = {
  onHide: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
};

export default memo(InformationModal);
