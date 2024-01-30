import React, { memo, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { DAS_HOST } from '../constants';
import LoadingOverlay from '../LoadingOverlay';

import styles from './styles.module.scss';

const ALERTS_URL = `${DAS_HOST}/alerts`;

const AlertsModal = ({ title }) => {
  const { t } = useTranslation('menu-drawer', { keyPrefix: 'alertsModal' });

  const [loading, setLoadState] = useState(true);

  return <>
    {loading && <LoadingOverlay />}

    <Modal.Header closeButton>
      <Modal.Title>{title}</Modal.Title>
    </Modal.Header>

    <Modal.Body>
      <iframe
        className={styles.alerts}
        onLoad={() => setLoadState(false)}
        src={ALERTS_URL}
        title={t('iframeTitle')}
      />

      {!loading && <p className={styles.message}>{t('iframeBottomMessage')}</p>}
    </Modal.Body>
  </>;
};

AlertsModal.propTypes = { title: PropTypes.string.isRequired };

export default memo(AlertsModal);
