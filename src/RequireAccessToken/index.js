import React, { memo } from 'react';
import { connect } from 'react-redux';
import { Navigate, useLocation } from 'react-router';
import { useAuth0 } from '@auth0/auth0-react';

import { getTemporaryAccessTokenFromCookies } from '../utils/auth';
import { hasOAuthCallbackParams } from '../utils/oauth';
import { REACT_APP_ROUTE_PREFIX } from '../constants';
import LoadingOverlay from '../LoadingOverlay';

const RequireAccessToken = ({ children, token, systemConfig }) => {
  const location = useLocation();
  const { isLoading: auth0Loading } = useAuth0();

  const temporaryAccessToken = getTemporaryAccessTokenFromCookies();
  const requireIdp = !!systemConfig?.require_idp;

  // Check if we're in the middle of an OAuth callback
  const hasOAuthParams = hasOAuthCallbackParams(location.search);

  if (requireIdp && (hasOAuthParams || auth0Loading)) {
    return <LoadingOverlay />;
  }

  return (temporaryAccessToken || token.access_token)
    ? children
    : <Navigate
        replace
        state={{ from: { ...location } }}
        {...(() => { try { localStorage.setItem('er:intended_route', `${location.pathname}${location.search}`); } catch (_) {} return {}; })()}
        to={{ pathname: `${REACT_APP_ROUTE_PREFIX}login`, search: location.search }}
      />;
};

const mapStateToProps = ({ data: { token }, view: { systemConfig } }) => ({ token, systemConfig });

export default connect(mapStateToProps)(memo(RequireAccessToken));
