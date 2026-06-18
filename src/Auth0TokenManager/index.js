import { useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { clearAuth, POST_AUTH_SUCCESS } from '../ducks/auth';
import { GATE_RESULT, checkAccountLinked } from '../ducks/account-linking';
import useNavigate from '../hooks/useNavigate';
import { redirectToExternalUrl } from '../utils/navigation';
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
  const { isAuthenticated, getAccessTokenSilently, logout } = useAuth0();
  const existingToken = useSelector((state) => state.data.token?.access_token);
  const requireIdp = useSelector((state) => !!state.view.systemConfig?.require_idp);
  const idpOrgId = useSelector((state) => state.view.systemConfig?.idp_org_id);
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

          // Account-linking gate — common-DB path only (require_idp and no
          // IdP organization). Org-scoped (rcuksa) require_idp sites skip it.
          if (requireIdp && !idpOrgId?.trim()) {
            const { result, linkUrl } = await checkAccountLinked(safe);

            if (result === GATE_RESULT.UNLINKED) {
              // No active user yet — hand off to the server-owned link page.
              // Persist nothing; never enter the authenticated state.
              if (linkUrl) {
                redirectToExternalUrl(linkUrl);
              } else {
                navigate(`${REACT_APP_ROUTE_PREFIX}login`, { replace: true, state: { authLinkingError: true } });
              }
              return;
            }

            if (result === GATE_RESULT.INVALID) {
              // Token is unusable — restart login from scratch. Clear the SDK
              // session (fire-and-forget) plus the SPA's own token state.
              logout({ openUrl: false }).catch(() => {});
              dispatch(clearAuth());
              navigate(`${REACT_APP_ROUTE_PREFIX}login`, { replace: true });
              return;
            }

            if (result === GATE_RESULT.TRANSIENT) {
              // Network/5xx/timeout/cancellation: transient. Don't authenticate
              // and don't clear the Auth0 SDK session (unlike the 400 path) so a
              // retry can reuse it; /login surfaces a retryable error.
              navigate(`${REACT_APP_ROUTE_PREFIX}login`, { replace: true, state: { authLinkingError: true } });
              return;
            }
            // result === GATE_RESULT.LINKED → fall through and proceed.
          }

          // Persist token
          document.cookie = `token=${safe};path=/`;
          dispatch({ type: POST_AUTH_SUCCESS, payload: { data: { access_token: safe } } });

          // Determine return route (localStorage survives Auth0 redirect)
          const intendedRoute = getIntendedPostAuth0SuccessRoute();
          const returnTo = intendedRoute && !/\/login\b/.test(intendedRoute)
            ? intendedRoute
            : REACT_APP_ROUTE_PREFIX;
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
  }, [dispatch, existingToken, getAccessTokenSilently, idpOrgId, isAuthenticated, logout, requireIdp, navigate, location.search]);

  return null;
};

export default Auth0TokenManager;
