import React, { memo, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Redirect, useHistory, useLocation } from 'react-router-dom';

import { FEATURE_FLAGS, REACT_APP_ROUTE_PREFIX } from '../constants';
import { fetchCurrentUser } from '../ducks/user';
import { fetchSystemStatus } from '../ducks/system-status';
import { useFeatureFlag } from '../hooks';

const RequireEulaConfirmation = ({ children, fetchCurrentUser, fetchSystemStatus, user }) => {
  const history = useHistory();
  const location = useLocation();

  const [eulaAccepted, setEulaAccepted] = useState('unknown');

  useEffect(() => {
    fetchSystemStatus();
  }, [fetchSystemStatus]);

  useEffect(() => {
    fetchCurrentUser()
      .catch(() => {
        history.push({ pathname: `${REACT_APP_ROUTE_PREFIX}login`, search: location.search });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchCurrentUser]);

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
    return <Redirect to={{ pathname: `${REACT_APP_ROUTE_PREFIX}eula`, search: location.search }} />;
  }
  return eulaAccepted === 'unknown' ? null : children;
};

const mapStateToProps = ({ data: { user } }) => ({ user });

export default connect(mapStateToProps, { fetchCurrentUser, fetchSystemStatus })(memo(RequireEulaConfirmation));
