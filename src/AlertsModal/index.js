import React, { Fragment, useState, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Modal from 'react-bootstrap/Modal';

import { REACT_APP_DAS_HOST } from '../constants';
import { removeModal } from '../ducks/modals';
import LoadingOverlay from '../LoadingOverlay';

const { Header, Title, Body } = Modal;


const AlertsModal = ({ id, title, removeModal, params = {} }) => {
  const [loading, setLoadState] = useState(true);

  return <Fragment>
    {loading && <LoadingOverlay />}
    <Header closeButton>
      <Title>{title}</Title>
    </Header>
    <Body>
      <iframe src={`${REACT_APP_DAS_HOST}/alerts`} onLoad={() => setLoadState(false)} />
    </Body>
  </Fragment>;
};

AlertsModal.defaultProps = {
  params: {},
};

AlertsModal.propTypes = {
  id: PropTypes.string.isRequired,
  removeModal: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  params: PropTypes.object,
};


export default connect(null, { removeModal })(memo(AlertsModal));