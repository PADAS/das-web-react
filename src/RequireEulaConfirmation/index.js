import React, { memo, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';

import { APP_ROUTES } from '../constants/routes';
import { fetchCurrentUser } from '../ducks/user';
import { SYSTEM_CONFIG_FLAGS } from '../constants';
import useNavigate from '../hooks/useNavigate';

const RequireEulaConfirmation = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const eulaEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.EULA]);
  const user = useSelector((state) => state.data.user);

  const [eulaAccepted, setEulaAccepted] = useState('unknown');

  useEffect(() => {
    dispatch(fetchCurrentUser())
      .catch(() => {
        navigate({ pathname: APP_ROUTES.LOGIN, search: location.search });
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
      to={{ pathname: APP_ROUTES.EULA, search: location.search }}
    />;
  }
  return eulaAccepted === 'unknown' ? null : children;
};

export default memo(RequireEulaConfirmation);
