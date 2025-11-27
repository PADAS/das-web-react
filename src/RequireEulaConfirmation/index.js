import React, { memo, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';

import { SYSTEM_CONFIG_FLAGS, REACT_APP_ROUTE_PREFIX } from '../constants';
import { fetchCurrentUser } from '../ducks/user';
import { fetchSystemStatus } from '../ducks/system-status';
import useNavigate from '../hooks/useNavigate';

const RequireEulaConfirmation = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const eulaEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.EULA]);
  const user = useSelector((state) => state.data.user);

  const [eulaAccepted, setEulaAccepted] = useState('unknown');

  useEffect(() => {
    dispatch(fetchSystemStatus());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchCurrentUser())
      .catch(() => {
        navigate({ pathname: `${REACT_APP_ROUTE_PREFIX}login`, search: location.search });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // null check to distinguish from eulaEnabled = false
    if (user.id && eulaEnabled !== null) {
      const accepted = user.hasOwnProperty('accepted_eula') ? user.accepted_eula : true;
      const ignoreEula = eulaEnabled === false;

      setEulaAccepted(accepted || ignoreEula);
    }
  }, [eulaEnabled, user]);

  if (!eulaAccepted) {
    return <Navigate
      replace
      state={{ from: { ...location } }}
      to={{ pathname: `${REACT_APP_ROUTE_PREFIX}eula`, search: location.search }}
    />;
  }
  return eulaAccepted === 'unknown' ? null : children;
};

export default memo(RequireEulaConfirmation);
