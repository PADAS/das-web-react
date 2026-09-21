import React, { memo, useEffect } from 'react';
import { connect } from 'react-redux';
import { Navigate, useLocation } from 'react-router';
import { useAuth0 } from '@auth0/auth0-react';

import { APP_ROUTES } from '../constants/routes';
import { getTemporaryAccessTokenFromCookies, setIntendedPostAuth0SuccessRoute } from '../utils/auth';
import { hasAuth0CallbackParams } from '../utils/auth0';
import LoadingOverlay from '../LoadingOverlay';

const RequireAccessToken = ({ children, token, systemConfig }) => {
  const location = useLocation();
  const { isLoading: auth0Loading } = useAuth0();

  const temporaryAccessToken = getTemporaryAccessTokenFromCookies();
  const requireIdp = !!systemConfig?.require_idp;
  const hasAuth0Params = hasAuth0CallbackParams(location.search);

  const hasToken = temporaryAccessToken || token.access_token;

  // Store intended route when redirecting to login (only for IDP mode to survive Auth0 redirect)
  useEffect(() => {
    if (requireIdp && !hasToken && !hasAuth0Params) {
      setIntendedPostAuth0SuccessRoute(`${location.pathname}${location.search}`);
    }
  }, [requireIdp, hasToken, hasAuth0Params, location.pathname, location.search]);

  // Show loading during Auth0 callback OR while Auth0 is processing
  if ((requireIdp && auth0Loading) || hasAuth0Params) {
    return <LoadingOverlay />;
  }

  if (hasToken) {
    return children;
  }

  // An Auth0 error response has no `code`, so it is not a callback and lands here.
  // Its params are the only ones the login page reads.
  const auth0ErrorSearch = new URLSearchParams(location.search).has('error')
    ? location.search
    : '';

  return <Navigate
    replace
    state={{ from: location }}
    to={{ pathname: APP_ROUTES.LOGIN, search: auth0ErrorSearch }}
  />;
};

const mapStateToProps = ({ data: { token }, view: { systemConfig } }) => ({ token, systemConfig });

export default connect(mapStateToProps)(memo(RequireAccessToken));
