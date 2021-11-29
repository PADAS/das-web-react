import React, { lazy, memo, Suspense, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Redirect, withRouter } from 'react-router-dom';

import { useFeatureFlag } from '../hooks';
import { REACT_APP_ROUTE_PREFIX, FEATURE_FLAGS } from '../constants';
import { fetchCurrentUser } from '../ducks/user';
import { fetchSystemStatus } from '../ducks/system-status';

import LoadingOverlay from '../EarthRangerIconLoadingOverlay';

const PrivateRoute = lazy(() => import('../PrivateRoute'));

const EulaProtectedRoute = ({
  // eslint-disable-next-line no-unused-vars
  dispatch: _dispatch,
  history,
  fetchCurrentUser,
  fetchSystemStatus,
  location,
  user,
  ...rest
}) => {
  const [eulaAccepted, setEulaAccepted] = useState('unknown');

  useEffect(() => {
    fetchSystemStatus();
  }, [fetchSystemStatus]);

  useEffect(() => {
    fetchCurrentUser()
      .catch(() => {
        history.push({
          pathname: `${REACT_APP_ROUTE_PREFIX}login`,
          search: location.search,
        });
      });
  }, [fetchCurrentUser]); /* eslint-disable-line */

  const eulaEnabled = useFeatureFlag(FEATURE_FLAGS.EULA);

  useEffect(() => {
    // null check to distinguish from eulaEnabled = false
    if (user.id && !(eulaEnabled == null)) {
      const accepted = user.hasOwnProperty('accepted_eula')
        ? user.accepted_eula
        : true;
      const ignoreEula = (eulaEnabled === false);
      setEulaAccepted(accepted || ignoreEula);
    }
  }, [eulaEnabled, user]);

  return <>
    {!eulaAccepted && <Redirect to={{
      pathname: `${REACT_APP_ROUTE_PREFIX}eula`,
      search: location.search,
    }} />}
    {eulaAccepted === 'unknown' ? null : <Suspense fallback={<LoadingOverlay />}>
      <PrivateRoute {...rest} />
    </Suspense>}
  </>;
};

const mapStateToProps = ({ data: { user } }) => ({ user });

export default connect(mapStateToProps, { fetchCurrentUser, fetchSystemStatus })(memo(withRouter(EulaProtectedRoute)));
