import React, { Fragment, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Modal, Button, Form } from 'react-bootstrap';
import { CancelToken } from 'axios';


import { API_URL } from '../constants';
import { hideModal } from '../ducks/modals';
import { downloadFileFromUrl } from '../utils/download';
import LoadingOverlay from '../LoadingOverlay';


const { Header, Title, Body, Footer } = Modal;
const DOWNLOAD_URL = `${API_URL}trackingdata/export`;


const SubjectInfoModal = ({ id, hideModal }) => {
  const [downloading, setDownloadState] = useState(false);
  const [downloadCancelToken, setCancelToken] = useState(CancelToken.source());

  useEffect(() => {
    return () => {
      downloadCancelToken && downloadCancelToken.cancel();
      setDownloadState(false);
    }
  }, []);

  const triggerDownload = () => {
    setDownloadState(true);
    downloadFileFromUrl(DOWNLOAD_URL, {}, downloadCancelToken)
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
    triggerDownload()
  };


  return <Fragment>
    {downloading && <LoadingOverlay />}
    <Header closeButton>
      <Title>Export Subject Reports</Title>
    </Header>
    <Form onSubmit={handleFormSubmit}>
      <Body>
      </Body>
      <Footer>
        <Button variant="secondary" onClick={() => hideModal(id)}>Cancel</Button>
        <Button type="submit" variant="primary">Export</Button>
      </Footer>
    </Form>
  </Fragment>
};

SubjectInfoModal.propTypes = {
  id: PropTypes.string.isRequired,
  hideModal: PropTypes.func.isRequired,
};


export default connect(null, { hideModal })(SubjectInfoModal);