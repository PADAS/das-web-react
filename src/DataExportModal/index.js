import React, { Fragment, useState, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Modal, Button, Form } from 'react-bootstrap';
import { CancelToken } from 'axios';


import { API_URL } from '../constants';
import { hideModal } from '../ducks/modals';
import { downloadFileFromUrl } from '../utils/download';
import LoadingOverlay from '../LoadingOverlay';


const { Header, Title, Body, Footer } = Modal;


const DataExportModal = memo(({ id, title, hideModal, params = {}, url, children }) => {
  const [downloading, setDownloadState] = useState(false);
  const [downloadCancelToken, setCancelToken] = useState(CancelToken.source());
  
  const DOWNLOAD_URL = `${API_URL}${url}`;

  useEffect(() => {
    return () => {
      downloadCancelToken && downloadCancelToken.cancel();
      setDownloadState(false);
    }
  }, []);

  const triggerDownload = () => {
    setDownloadState(true);
    downloadFileFromUrl(DOWNLOAD_URL, params, downloadCancelToken)
      .finally(() => {
        setCancelToken(CancelToken.source());
        setDownloadState(false);
      })
      .then(() => {
        hideModal(id);
      });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    triggerDownload();
  };


  return <Fragment>
    {downloading && <LoadingOverlay />}
    <Header closeButton>
      <Title>{title}</Title>
    </Header>
    <Form onSubmit={handleFormSubmit}>
      {!!children &&
        <Body>
          {children}
        </Body>
      }
      <Footer>
        <Button variant="secondary" onClick={() => hideModal(id)}>Cancel</Button>
        <Button type="submit" variant="primary">Export</Button>
      </Footer>
    </Form>
  </Fragment>
});

DataExportModal.defaultProps = {
  params: {},
};

DataExportModal.propTypes = {
  id: PropTypes.string.isRequired,
  hideModal: PropTypes.func.isRequired,
  url: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  params: PropTypes.object,
};


export default connect(null, { hideModal })(DataExportModal);