import React, { memo } from 'react';
import { Redirect, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { getTemporaryAccessTokenFromCookies } from '../utils/auth';
import { REACT_APP_ROUTE_PREFIX } from '../constants';

const RequireAccessToken = ({ children }) => {
  const location = useLocation();

  const token = useSelector((data) => data.token);

  const temporaryAccessToken = getTemporaryAccessTokenFromCookies();

  return (temporaryAccessToken || token.access_token)
    ? children
    : <Redirect to={{
        pathname: `${REACT_APP_ROUTE_PREFIX}login`,
        search: location.search,
        state: { from: location }
      }}/>;
};

export default memo(RequireAccessToken);
