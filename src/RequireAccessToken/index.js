import React, { memo } from 'react';
import { connect } from 'react-redux';
import { Navigate, useLocation } from 'react-router';

import { getTemporaryAccessTokenFromCookies } from '../utils/auth';
import { REACT_APP_ROUTE_PREFIX } from '../constants';

const RequireAccessToken = ({ children, token }) => {
  const location = useLocation();

  const temporaryAccessToken = getTemporaryAccessTokenFromCookies();

  return (temporaryAccessToken || token.access_token)
    ? children
    : <Navigate
        replace
        state={{ from: { ...location } }}
        {...(() => { try { localStorage.setItem('er:intended_route', `${location.pathname}${location.search}`); } catch (_) {} return {}; })()}
        to={{ pathname: `${REACT_APP_ROUTE_PREFIX}login`, search: location.search }}
      />;
};

const mapStateToProps = ({ data: { token } }) => ({ token });

export default connect(mapStateToProps)(memo(RequireAccessToken));
