import React, { Fragment, memo, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Redirect, withRouter } from 'react-router-dom';

import { REACT_APP_ROUTE_PREFIX } from '../constants';
import { fetchCurrentUser } from '../ducks/user';
import { fetchSystemStatus } from '../ducks/system-status';

/* ADD BACK AFTER LAZY LOADING MISSING CHUNK ERROR IS RESOLVED */
// import LoadingOverlay from '../EarthRangerIconLoadingOverlay';
// const PrivateRoute = lazy(() => import('../PrivateRoute'));

import PrivateRoute from '../PrivateRoute';

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

  return <Fragment>
    {!eulaAccepted && <Redirect to={{
      pathname: `${REACT_APP_ROUTE_PREFIX}eula`,
      search: this.props.location.search,
    }} />}
    {eulaAccepted === 'unknown' ? null : <PrivateRoute {...rest} />}
  </Fragment>;
};


const mapStateToProps = ({ data: { user }, view: { systemConfig: { eulaEnabled } } }) => ({
  user, eulaEnabled
});

export default connect(mapStateToProps, { fetchCurrentUser, fetchSystemStatus })(memo(withRouter(EulaProtectedRoute)));