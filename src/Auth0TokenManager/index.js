import { useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { POST_AUTH_SUCCESS } from '../ducks/auth';
import useNavigate from '../hooks/useNavigate';
import appConfig from '../config';
import { REACT_APP_ROUTE_PREFIX } from '../constants';
import { hasAuth0CallbackParams } from '../utils/auth0';
import {
  clearIntendedPostAuth0SuccessRoute,
  getIntendedPostAuth0SuccessRoute,
  isValidTokenFormat,
  stripAuth0Params,
} from '../utils/auth';

const Auth0TokenManager = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const existingToken = useSelector((state) => state.data.token?.access_token);
  const requireIdp = useSelector((state) => !!state.view.systemConfig?.require_idp);
  const hasHandledCallback = useRef(false);
  const sawAuth0Params = useRef(false);

  useEffect(() => {

    const ensureIdpToken = async () => {
      const hasAuth0Params = hasAuth0CallbackParams(location.search);
      // Remember if we ever saw Auth0 params (they disappear when Auth0Provider processes them)
      if (hasAuth0Params) {
        sawAuth0Params.current = true;
      }

      // Auth0 callback path: process when we saw params AND user is now authenticated
      if (sawAuth0Params.current && isAuthenticated && !hasHandledCallback.current) {
        hasHandledCallback.current = true;

        try {
          // Auth0Provider has processed the callback, now get the token
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: appConfig.auth0.audience,
            },
          });

          const safe = String(token).trim();
          if (!isValidTokenFormat(safe)) {
            console.warn('Auth token format rejected');
            navigate(`${REACT_APP_ROUTE_PREFIX}login`, { replace: true });
            return;
          }

          // Persist token
          document.cookie = `token=${safe};path=/`;
          dispatch({ type: POST_AUTH_SUCCESS, payload: { data: { access_token: safe } } });

          // Determine return route (localStorage survives Auth0 redirect)
          const intendedRoute = getIntendedPostAuth0SuccessRoute();
          const returnTo = intendedRoute && !/\/login\b/.test(intendedRoute)
            ? intendedRoute
            : `${REACT_APP_ROUTE_PREFIX}events`;
          clearIntendedPostAuth0SuccessRoute();

          const cleanUrl = stripAuth0Params(returnTo);
          navigate(cleanUrl, { replace: true, state: { comesFromLogin: true } });
        } catch (e) {
          console.error('Auth0 callback failed:', e);
          navigate(`${REACT_APP_ROUTE_PREFIX}login`, { replace: true });
        }
        return;
      }

      if (!requireIdp || !isAuthenticated || existingToken) {
        return;
      }
    };
    ensureIdpToken();
  }, [dispatch, existingToken, getAccessTokenSilently, isAuthenticated, requireIdp, navigate, location.search]);

  return null;
};

export default Auth0TokenManager;
