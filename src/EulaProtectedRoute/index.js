import React, { Fragment, memo, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Redirect, withRouter } from 'react-router-dom';

import { evaluateFeatureFlag } from '../utils/feature-flags';
import { REACT_APP_ROUTE_PREFIX, FEATURE_FLAGS } from '../constants';
import { fetchCurrentUser } from '../ducks/user';
import { fetchSystemStatus } from '../ducks/system-status';

/* ADD BACK AFTER LAZY LOADING MISSING CHUNK ERROR IS RESOLVED */
// import LoadingOverlay from '../EarthRangerIconLoadingOverlay';
// const PrivateRoute = lazy(() => import('../PrivateRoute'));

import PrivateRoute from '../PrivateRoute';

const EulaProtectedRoute = (props) => {
  const { dispatch:_dispatch, history, fetchCurrentUser, fetchSystemStatus, location, user, ...rest } = props;

  const [eulaAccepted, setEulaAccepted] = useState('unknown');

  useEffect(() => {
    fetchSystemStatus();
  }, [fetchSystemStatus]);

  useEffect(() => {
    fetchCurrentUser()
      .catch((error) => {
        history.push({
          pathname: `${REACT_APP_ROUTE_PREFIX}login`,
          search: location.search,
        });
      });
  }, [fetchCurrentUser]); /* eslint-disable-line */

  useEffect(() => {
    const eulaEnabled = evaluateFeatureFlag(FEATURE_FLAGS.EULA);
    // null check to distinguish from eulaEnabled = false
    if (user.id && !(eulaEnabled == null)) {
      const accepted = user.hasOwnProperty('accepted_eula') 
        ? user.accepted_eula
        : true;
      const ignoreEula = (eulaEnabled === false);
      setEulaAccepted(accepted || ignoreEula);
    }
  }, [user]);

  return <Fragment>
    {!eulaAccepted && <Redirect to={{
      pathname: `${REACT_APP_ROUTE_PREFIX}eula`,
      search: location.search,
    }} />}
    {eulaAccepted === 'unknown' ? null : <PrivateRoute {...rest} />}
  </Fragment>;
};


const mapStateToProps = ({ data: { user } }) => ({
  user,
});

export default connect(mapStateToProps, { fetchCurrentUser, fetchSystemStatus })(memo(withRouter(EulaProtectedRoute)));