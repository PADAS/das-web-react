import React, { memo, useEffect } from 'react';
import { connect } from 'react-redux';
import { Navigate, useLocation } from 'react-router';
import { useAuth0 } from '@auth0/auth0-react';

import { getTemporaryAccessTokenFromCookies, setIntendedRoute } from '../utils/auth';
import { hasOAuthCallbackParams } from '../utils/oauth';
import { REACT_APP_ROUTE_PREFIX } from '../constants';
import LoadingOverlay from '../LoadingOverlay';

const RequireAccessToken = ({ children, token, systemConfig }) => {
  const location = useLocation();
  const { isLoading: auth0Loading } = useAuth0();

  const temporaryAccessToken = getTemporaryAccessTokenFromCookies();
  const requireIdp = !!systemConfig?.require_idp;
  const hasOAuthParams = hasOAuthCallbackParams(location.search);

  const hasToken = temporaryAccessToken || token.access_token;

  // Store intended route when redirecting to login (only for IDP mode to survive OAuth redirect)
  useEffect(() => {
    if (requireIdp && !hasToken && !hasOAuthParams) {
      setIntendedRoute(`${location.pathname}${location.search}`);
    }
  }, [requireIdp, hasToken, hasOAuthParams, location.pathname, location.search]);

  // Show loading during OAuth callback OR while Auth0 is processing
  if ((requireIdp && auth0Loading) || hasOAuthParams) {
    return <LoadingOverlay />;
  }

  if (hasToken) {
    return children;
  }

  return <Navigate
    replace
    state={{ from: location }}
    to={`${REACT_APP_ROUTE_PREFIX}login`}
  />;
};

const mapStateToProps = ({ data: { token }, view: { systemConfig } }) => ({ token, systemConfig });

export default connect(mapStateToProps)(memo(RequireAccessToken));
