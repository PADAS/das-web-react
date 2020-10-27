import React, { Fragment, useState, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Modal from 'react-bootstrap/Modal';

import { removeModal } from '../ducks/modals';
import LoadingOverlay from '../LoadingOverlay';
import { fetchTableauDashboard } from '../ducks/reports';


const { Header, Title, Body } = Modal;


const TableauModal = ({ id, title, removeModal, params = {}, paramString, fetchTableauDashboard, reports, url, children }) => {

  useEffect(() => {
    fetchTableauDashboard();
  }, []);

  useEffect(() => {
    if (isTableauDashboardDataValid()) {
      const script = document.createElement("script");
      script.src = "https://tableau.pamdas.org/javascripts/api/viz_v1.js";
      script.type = 'text/javascript';
      
      document.body.appendChild(script);
    }
  }, [reports.tableauDashboard]);

  const isTableauDashboardDataValid = () => {
    return Boolean(reports.tableauDashboard.server);
  }

  const { display_url } = reports.tableauDashboard;

  return <Fragment>
    {reports.isFetching && <LoadingOverlay />}
    <Header closeButton>
      <Title>{title}</Title>
    </Header>
    <Body>
      {isTableauDashboardDataValid() && <iframe src={display_url} width="100%" height="100%" />}
    </Body>
  </Fragment>;
};

TableauModal.defaultProps = {
  params: {},
  paramString: '',
};

TableauModal.propTypes = {
  id: PropTypes.string.isRequired,
  removeModal: PropTypes.func.isRequired,
  url: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  params: PropTypes.object,
  paramString: PropTypes.string,
};

const mapStatetoProps = ({ data: { reports } }) => ({ reports });

export default connect(mapStatetoProps, { removeModal, fetchTableauDashboard })(memo(TableauModal));
