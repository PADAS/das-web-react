import React, { memo, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { FEATURE_FLAGS, REACT_APP_ROUTE_PREFIX } from '../constants';
import { fetchCurrentUser } from '../ducks/user';
import { fetchSystemStatus } from '../ducks/system-status';
import { useFeatureFlag } from '../hooks';

const RequireEulaConfirmation = ({ children, fetchCurrentUser, fetchSystemStatus, user }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [eulaAccepted, setEulaAccepted] = useState('unknown');

  useEffect(() => {
    fetchSystemStatus();
  }, [fetchSystemStatus]);

  useEffect(() => {
    fetchCurrentUser()
      .catch(() => {
        navigate({ pathname: `${REACT_APP_ROUTE_PREFIX}login`, search: location.search });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchCurrentUser, navigate]);

  const eulaEnabled = useFeatureFlag(FEATURE_FLAGS.EULA);

  useEffect(() => {
    // null check to distinguish from eulaEnabled = false
    if (user.id && eulaEnabled !== null) {
      const accepted = user.hasOwnProperty('accepted_eula') ? user.accepted_eula : true;
      const ignoreEula = eulaEnabled === false;

      setEulaAccepted(accepted || ignoreEula);
    }
  }, [eulaEnabled, user]);

  if (!eulaAccepted) {
    return <Navigate replace to={{ pathname: `${REACT_APP_ROUTE_PREFIX}eula`, search: location.search }} />;
  }
  return eulaAccepted === 'unknown' ? null : children;
};

const mapStateToProps = ({ data: { user } }) => ({ user });

export default connect(mapStateToProps, { fetchCurrentUser, fetchSystemStatus })(memo(RequireEulaConfirmation));
