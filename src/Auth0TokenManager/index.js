import { useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { POST_AUTH_SUCCESS } from '../ducks/auth';
import useNavigate from '../hooks/useNavigate';
import { REACT_APP_ROUTE_PREFIX } from '../constants';
import { hasAuth0CallbackParams } from '../utils/auth0';
import {
  clearIntendedRoute,
  getIntendedRoute,
  isValidTokenFormat,
  stripOAuthParams,
} from '../utils/auth';

const Auth0TokenManager = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const existingToken = useSelector((state) => state.data.token?.access_token);
  const requireIdp = useSelector((state) => !!state.view.systemConfig?.require_idp);
  const hasHandledCallback = useRef(false);
  const sawOAuthParams = useRef(false);

  useEffect(() => {

    const ensureIdpToken = async () => {
      const hasOAuthParams = hasAuth0CallbackParams(location.search);
      // Remember if we ever saw OAuth params (they disappear when Auth0Provider processes them)
      if (hasOAuthParams) {
        sawOAuthParams.current = true;
      }

      // OAuth callback path: process when we saw params AND user is now authenticated
      if (sawOAuthParams.current && isAuthenticated && !hasHandledCallback.current) {
        hasHandledCallback.current = true;

        try {
          // Auth0Provider has processed the callback, now get the token
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: process.env.REACT_APP_AUTH0_AUDIENCE,
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

          // Determine return route (localStorage survives OAuth redirect)
          const intendedRoute = getIntendedRoute();
          const returnTo = intendedRoute && !/\/login\b/.test(intendedRoute)
            ? intendedRoute
            : REACT_APP_ROUTE_PREFIX;
          clearIntendedRoute();

          const cleanUrl = stripOAuthParams(returnTo);
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
