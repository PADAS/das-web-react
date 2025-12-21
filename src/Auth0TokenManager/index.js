import { useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { POST_AUTH_SUCCESS } from '../ducks/auth';
import useNavigate from '../hooks/useNavigate';
import { REACT_APP_ROUTE_PREFIX } from '../constants';
import { hasOAuthCallbackParams } from '../utils/oauth';
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

  useEffect(() => {
    const ensureIdpToken = async () => {
      if (!requireIdp) return;
      if (!isAuthenticated || existingToken) return;

      // Check if we're processing OAuth callback
      const hasOAuthParams = hasOAuthCallbackParams(location.search);

      if (hasOAuthParams && !hasHandledCallback.current) {
        hasHandledCallback.current = true;

        try {
          // Auth0Provider already handled the callback, just get the token
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: process.env.REACT_APP_AUTH0_AUDIENCE,
            },
          });

          const safe = String(token).trim();
          if (!isValidTokenFormat(token)) {
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
      } else if (!hasOAuthParams) {
        // Not a callback, just ensure token for already-authenticated users
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: process.env.REACT_APP_AUTH0_AUDIENCE,
            },
          });
          const safe = String(token).trim();
          if (!isValidTokenFormat(token)) {
            console.warn('Auth token format rejected');
            return;
          }
          document.cookie = `token=${safe};path=/`;
          dispatch({ type: POST_AUTH_SUCCESS, payload: { data: { access_token: safe } } });
        } catch (_) {
          // silently ignore; UI will route to login if needed
        }
      }
    };
    ensureIdpToken();
  }, [dispatch, existingToken, getAccessTokenSilently, isAuthenticated, requireIdp, navigate, location.search]);

  return null;
};

export default Auth0TokenManager;
