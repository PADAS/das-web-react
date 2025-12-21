import { useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { POST_AUTH_SUCCESS } from '../ducks/auth';
import useNavigate from '../hooks/useNavigate';
import { REACT_APP_ROUTE_PREFIX } from '../constants';
import { hasOAuthCallbackParams } from '../utils/oauth';

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
          if (!/^[A-Za-z0-9._-]+$/.test(safe)) {
            console.warn('Auth token format rejected');
            navigate(`${REACT_APP_ROUTE_PREFIX}login`, { replace: true });
            return;
          }

          // Persist token
          document.cookie = `token=${safe};path=/`;
          dispatch({ type: POST_AUTH_SUCCESS, payload: { data: { access_token: safe } } });

          // Navigate to intended route
          const storedIntended = (() => { try { return localStorage.getItem('er:intended_route'); } catch (_) { return null; } })();
          const rawReturnTo = storedIntended || REACT_APP_ROUTE_PREFIX;
          const returnTo = /\/login\b/.test(rawReturnTo) ? REACT_APP_ROUTE_PREFIX : rawReturnTo;
          console.log('[Auth0TokenManager] Navigation:', { storedIntended, rawReturnTo, returnTo, currentLocation: location.pathname });
          try { localStorage.removeItem('er:intended_route'); } catch (_) {}

          // Strip OAuth params from URL
          const [pathname, searchString] = returnTo.split('?');
          let cleanSearch = '';
          if (searchString) {
            const params = new URLSearchParams(searchString);
            params.delete('code');
            params.delete('state');
            const remaining = params.toString();
            if (remaining) cleanSearch = `?${remaining}`;
          }

          console.log('[Auth0TokenManager] Navigating to:', pathname + cleanSearch);
          navigate(pathname + cleanSearch, { replace: true, state: { comesFromLogin: true } });
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
          if (!/^[A-Za-z0-9._-]+$/.test(safe)) {
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
