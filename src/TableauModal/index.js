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

      console.log(encodeURIComponent(server))
      
      document.body.appendChild(script);
    }
  }, [reports.tableauDashboard]);

  const isTableauDashboardDataValid = () => {
    return Boolean(reports.tableauDashboard.server);
  }

  const { name, server, site_root, ticket } = reports.tableauDashboard;

  return <Fragment>
    {reports.isFetching && <LoadingOverlay />}
    <Header closeButton>
      <Title>{title}</Title>
    </Header>
    <Body>
      {isTableauDashboardDataValid() && <div class='tableauPlaceholder' style={{width: '100%', height: '100%'}}>
        <object class='tableauViz' width='100%' height='100%' style={{display: 'none'}}>
          <param name='host_url' value={encodeURIComponent(`${server}/`)} />
          <param name='embed_code_version' value='3' />
          <param name='site_root' value={site_root} />
          <param name='name' value={name} /> 
          <param name='ticket' value={ticket} />
          <param name='tabs' value='yes' />
          <param name='toolbar' value='no' />
          <param name='showAppBanner' value='false' />
          <param name='alerts' value='no'/>
          <param name='dataDetails' value='no' />
          <param name='customViews' value='no'/>
          <param name='showShareOptions' value='false' />
          <param name='subscriptions' value='no'/>
          <param name='tabs' value='yes'/>
        </object>
      </div>}
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
