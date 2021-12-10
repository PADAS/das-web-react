import React, { Fragment, useState, memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Modal from 'react-bootstrap/Modal';

import { REACT_APP_DAS_HOST } from '../constants';
import { removeModal } from '../ducks/modals';
import LoadingOverlay from '../LoadingOverlay';

const { Header, Title, Body } = Modal;

const AlertsModal = ({ title }) => {
  const [loading, setLoadState] = useState(true);

  return <Fragment>
    {loading && <LoadingOverlay />}
    <Header closeButton>
      <Title>{title}</Title>
    </Header>
    <Body>
      <iframe title='Configure your EarthRanger alerts' src={`${REACT_APP_DAS_HOST}/alerts`} onLoad={() => setLoadState(false)} />
    </Body>
  </Fragment>;
};

AlertsModal.propTypes = {
  title: PropTypes.string.isRequired,
};


export default connect(null, { removeModal })(memo(AlertsModal));