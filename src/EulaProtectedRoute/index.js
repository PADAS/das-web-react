import React, { Suspense, lazy, memo } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';

import { REACT_APP_ROUTE_PREFIX } from '../constants';

import LoadingOverlay from '../EarthRangerIconLoadingOverlay';

const PrivateRoute = lazy(() => import('../PrivateRoute'));

const EulaProtectedRoute = (props) => {
  const { dispatch:_dispatch, eula, user, ...rest } = props;

  const eulaAccepted = true; // !!user.accepted_eula && user.accepted_eula === eula.version

  return <Suspense fallback={<LoadingOverlay message='Loading...' />}>
    {!eulaAccepted && <Redirect to={`${REACT_APP_ROUTE_PREFIX}${REACT_APP_ROUTE_PREFIX === '/' ? 'eula' : '/eula'}`} />}
    {eulaAccepted && <PrivateRoute {...rest} />}
  </Suspense>;
};


const mapStateToProps = ({ data: { user, eula } }) => ({
  eula,
  user,
});

export default connect(mapStateToProps, null)(memo(EulaProtectedRoute));