import React, { memo, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import PropTypes from 'prop-types';

import { DAS_HOST } from '../constants';
import LoadingOverlay from '../LoadingOverlay';

import styles from './styles.module.scss';

const ALERTS_URL = `${DAS_HOST}/alerts`;

const AlertsModal = ({ title }) => {
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
        title='Configure your EarthRanger alerts'
      />

      {!loading && <p className={styles.message}>Each EarthRanger user can receive up to 20 alerts per day.</p>}
    </Modal.Body>
  </>;
};

AlertsModal.propTypes = { title: PropTypes.string.isRequired };


export default memo(AlertsModal);
