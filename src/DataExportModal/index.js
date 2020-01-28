import React, { Fragment, useState, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { CancelToken } from 'axios';
import { trackEvent } from '../utils/analytics';

import { API_URL } from '../constants';
import { removeModal } from '../ducks/modals';
import { downloadFileFromUrl } from '../utils/download';
import LoadingOverlay from '../LoadingOverlay';


const { Header, Title, Body, Footer } = Modal;


const DataExportModal = ({ id, title, removeModal, params = {}, url, children }) => {
  const [downloading, setDownloadState] = useState(false);
  const [downloadCancelToken, setCancelToken] = useState(CancelToken.source());
  
  const DOWNLOAD_URL = `${API_URL}${url}`;

  useEffect(() => {
    return () => {
      downloadCancelToken && downloadCancelToken.cancel();
      setDownloadState(false);
    };
  }, [downloadCancelToken]);

  const triggerDownload = () => {
    setDownloadState(true);
    downloadFileFromUrl(DOWNLOAD_URL, params, downloadCancelToken)
      .catch((e) => {
        console.warn('error downloading file', e);
      }) 
      .then(() => {
        removeModal(id);
      })
      .finally(() => {
        setCancelToken(CancelToken.source());
        setDownloadState(false);
      });
  };

  const onFormSubmit = (e) => {
    e.preventDefault();
    triggerDownload();
    trackEvent('Report Export', 'Click \'Export\' button');    
  };

  const onFormCancel = () => {
    removeModal(id);
    trackEvent('Report Export', 'Click \'Cancel\' button');    
  };

  return <Fragment>
    {downloading && <LoadingOverlay />}
    <Header closeButton>
      <Title>{title}</Title>
    </Header>
    <Form onSubmit={onFormSubmit}>
      {!!children &&
        <Body>
          {children}
        </Body>
      }
      <Footer>
        <Button variant="secondary" onClick={onFormCancel}>Cancel</Button>
        <Button type="submit" variant="primary">Export</Button>
      </Footer>
    </Form>
  </Fragment>;
};

DataExportModal.defaultProps = {
  params: {},
};

DataExportModal.propTypes = {
  id: PropTypes.string.isRequired,
  removeModal: PropTypes.func.isRequired,
  url: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  params: PropTypes.object,
};


export default connect(null, { removeModal })(memo(DataExportModal));