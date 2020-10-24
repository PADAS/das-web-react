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


const { Header, Title, Body } = Modal;


const TableauModal = ({ id, title, removeModal, params = {}, paramString, url, children }) => {
  const [downloading, setDownloadState] = useState(false);
  const [downloadCancelToken, setCancelToken] = useState(CancelToken.source());
  
  const DOWNLOAD_URL = `${API_URL}${url}${paramString.length ? `?${paramString}` : ''}`;

  useEffect(() => {
    return () => {
      downloadCancelToken && downloadCancelToken.cancel();
      setDownloadState(false);
    };
  }, [downloadCancelToken]);

  const triggerDownload = () => {
    setDownloadState(true);
    downloadFileFromUrl(DOWNLOAD_URL, { params }, downloadCancelToken)
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
    </Form>
  </Fragment>;
};

DataExportModal.defaultProps = {
  params: {},
  paramString: '',
};

DataExportModal.propTypes = {
  id: PropTypes.string.isRequired,
  removeModal: PropTypes.func.isRequired,
  url: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  params: PropTypes.object,
  paramString: PropTypes.string,
};


export default connect(null, { removeModal })(memo(TableauModal));