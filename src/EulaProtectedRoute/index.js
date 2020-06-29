import React, { Suspense, lazy, memo, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Redirect, withRouter } from 'react-router-dom';

import { REACT_APP_ROUTE_PREFIX } from '../constants';
import { fetchCurrentUser } from '../ducks/user';
import { fetchSystemStatus } from '../ducks/system-status';

import LoadingOverlay from '../EarthRangerIconLoadingOverlay';

const PrivateRoute = lazy(() => import('../PrivateRoute'));

const EulaProtectedRoute = (props) => {
  const { dispatch:_dispatch, fetchCurrentUser, fetchSystemStatus, user, eulaEnabled, ...rest } = props;

  const [eulaAccepted, setEulaAccepted] = useState('unknown');

  useEffect(() => {
    fetchSystemStatus();
  }, [fetchSystemStatus]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    // null check to distinguish from eulaEnabled = false
    if (user.id && !(eulaEnabled == null)) {
      const accepted = user.hasOwnProperty('accepted_eula') 
        ? user.accepted_eula
        : true;
      const ignoreEula = (eulaEnabled === false);
      setEulaAccepted(accepted || ignoreEula);
    }
  }, [user, eulaEnabled]);

  return <Suspense fallback={<LoadingOverlay message='Loading...' />}>
    {!eulaAccepted && <Redirect to={{
      pathname: `${REACT_APP_ROUTE_PREFIX}eula`,
      search: this.props.location.search,
    }} />}
    {eulaAccepted === 'unknown' ? null : <PrivateRoute {...rest} />}
  </Suspense>;
};


const mapStateToProps = ({ data: { user }, view: { systemConfig: { eulaEnabled } } }) => ({
  user, eulaEnabled
});

export default connect(mapStateToProps, { fetchCurrentUser, fetchSystemStatus })(memo(withRouter(EulaProtectedRoute)));