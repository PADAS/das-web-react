import React, { Suspense, useState, useEffect, lazy, memo } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';

import { REACT_APP_ROUTE_PREFIX } from '../constants';

import LoadingOverlay from '../EarthRangerIconLoadingOverlay';

const PrivateRoute = lazy(() => import('../PrivateRoute'));

const EulaProtectedRoute = (props) => {
  const { dispatch:_dispatch, eulaAccepted, ...rest } = props;

  return <Suspense fallback={<LoadingOverlay message='Loading...' />}>
    {!eulaAccepted && <Redirect to={`${REACT_APP_ROUTE_PREFIX}${REACT_APP_ROUTE_PREFIX === '/' ? 'eula' : '/eula'}`} />}
    {eulaAccepted && <PrivateRoute {...rest} />}
  </Suspense>;
};

EulaProtectedRoute.defaultProps = {
  eulaAccepted: false,
};

export default connect(null, null)(memo(EulaProtectedRoute));