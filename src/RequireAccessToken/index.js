import React, { memo, useEffect } from 'react';
import { connect } from 'react-redux';
import { Navigate, useLocation } from 'react-router';
import { useAuth0 } from '@auth0/auth0-react';

import { getTemporaryAccessTokenFromCookies, setIntendedPostAuth0SuccessRoute } from '../utils/auth';
import { hasAuth0CallbackParams } from '../utils/auth0';
import { REACT_APP_ROUTE_PREFIX } from '../constants';
import LoadingOverlay from '../LoadingOverlay';

const RequireAccessToken = ({ children, token, systemConfig, auth0CallbackInProgress }) => {
  const location = useLocation();
  const { isLoading: auth0Loading } = useAuth0();

  const temporaryAccessToken = getTemporaryAccessTokenFromCookies();
  const requireIdp = !!systemConfig?.require_idp;
  const hasAuth0Params = hasAuth0CallbackParams(location.search);

  const hasToken = temporaryAccessToken || token.access_token;

  // Store intended route when redirecting to login (only for IDP mode to survive Auth0 redirect).
  // Skip while the Auth0 callback is finalizing (the gate is in flight) — the
  // SDK has already cleaned the URL to the redirect_uri, so writing the route
  // here would clobber the user's original deep link.
  useEffect(() => {
    if (requireIdp && !hasToken && !hasAuth0Params && !auth0CallbackInProgress) {
      setIntendedPostAuth0SuccessRoute(`${location.pathname}${location.search}`);
    }
  }, [requireIdp, hasToken, hasAuth0Params, auth0CallbackInProgress, location.pathname, location.search]);

  // Show loading during Auth0 callback, while Auth0 is processing, or while the
  // post-callback account-linking gate is in flight.
  if ((requireIdp && auth0Loading) || hasAuth0Params || auth0CallbackInProgress) {
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

const mapStateToProps = ({ data: { token }, view: { systemConfig, auth0CallbackInProgress } }) =>
  ({ token, systemConfig, auth0CallbackInProgress });

export default connect(mapStateToProps)(memo(RequireAccessToken));
