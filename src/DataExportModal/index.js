import React, { memo, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { CancelToken } from 'axios';
import Modal from 'react-bootstrap/Modal';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { API_URL } from '../constants';
import { downloadFileFromUrl } from '../utils/download';
import { removeModal } from '../ducks/modals';
import { REPORT_EXPORT_CATEGORY, trackEventFactory } from '../utils/analytics';

import LoadingOverlay from '../LoadingOverlay';

const reportExportTracker = trackEventFactory(REPORT_EXPORT_CATEGORY);

const DataExportModal = ({ children, id, params, paramString, title, url }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('menu-drawer', { keyPrefix: 'dataExportModal' });

  const [downloading, setDownloadState] = useState(false);
  const [downloadCancelToken, setCancelToken] = useState(CancelToken.source());

  const DOWNLOAD_URL = `${API_URL}${url}${paramString.length ? `?${paramString}` : ''}`;

  const triggerDownload = () => {
    setDownloadState(true);
    downloadFileFromUrl(DOWNLOAD_URL, { params }, downloadCancelToken)
      .catch((error) => {
        console.warn('error downloading file', error);

        setCancelToken(CancelToken.source());
        setDownloadState(false);
      })
      .then(() => dispatch(removeModal(id)));
  };

  const onFormSubmit = () => {
    triggerDownload();

    reportExportTracker.track('Click \'Export\' button');
  };

  const onFormCancel = () => {
    dispatch(removeModal(id));

    reportExportTracker.track('Click \'Cancel\' button');
  };

  useEffect(() => () => {
    downloadCancelToken && downloadCancelToken.cancel();
    setDownloadState(false);
  }, [downloadCancelToken]);

  return <>
    {downloading && <LoadingOverlay />}

    <Modal.Header closeButton>
      <Modal.Title>{title}</Modal.Title>
    </Modal.Header>

    <div>
      {!!children && <Modal.Body>{children}</Modal.Body>}

      <Modal.Footer>
        <Button onClick={onFormCancel} variant="secondary" >{t('cancelButton')}</Button>

        <Button onClick={onFormSubmit} type="submit" variant="primary">{t('exportButton')}</Button>
      </Modal.Footer>
    </div>
  </>;
};

DataExportModal.defaultProps = {
  children: null,
  params: {},
  paramString: '',
};

DataExportModal.propTypes = {
  children: PropTypes.node,
  id: PropTypes.string.isRequired,
  params: PropTypes.object,
  paramString: PropTypes.string,
  title: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
};

export default memo(DataExportModal);
