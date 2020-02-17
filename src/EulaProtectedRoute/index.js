import React, { Suspense, lazy, memo, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';

import { REACT_APP_ROUTE_PREFIX } from '../constants';
import { fetchCurrentUser } from '../ducks/user';

import LoadingOverlay from '../EarthRangerIconLoadingOverlay';

const PrivateRoute = lazy(() => import('../PrivateRoute'));

const EulaProtectedRoute = (props) => {
  const { dispatch:_dispatch, fetchCurrentUser, user, ...rest } = props;

  const [eulaAccepted, setEulaAccepted] = useState('unknown');

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    const accepted = user.hasOwnProperty('accepted_eula') 
      ? user.accepted_eula 
      : user.id 
        ? true 
        : false;
    setEulaAccepted(accepted);
  }, [user]);

  return <Suspense fallback={<LoadingOverlay message='Loading...' />}>
    {!eulaAccepted && <Redirect to={`${REACT_APP_ROUTE_PREFIX}${REACT_APP_ROUTE_PREFIX === '/' ? 'eula' : '/eula'}`} />}
    {eulaAccepted === 'unknown' ? null : <PrivateRoute {...rest} />}
  </Suspense>;
};


const mapStateToProps = ({ data: { user } }) => ({
  user,
});

export default connect(mapStateToProps, { fetchCurrentUser })(memo(EulaProtectedRoute));