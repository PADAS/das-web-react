import { useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';

import appConfig from '../config';
import { REACT_APP_ROUTE_PREFIX } from '../constants';
import { applyAccessToken, clearAuth } from '../ducks/auth';
import useNavigate from '../hooks/useNavigate';
import { checkAccountLinked, GATE_RESULT } from '../utils/account-linking';
import {
  clearIntendedPostAuth0SuccessRoute,
  getIntendedPostAuth0SuccessRoute,
  isValidTokenFormat,
  stripAuth0Params,
} from '../utils/auth';
import { hasAuth0CallbackParams } from '../utils/auth0';
import { redirectToExternalUrl } from '../utils/navigation';

const Auth0TokenManager = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const existingToken = useSelector((state) => state.data.token?.access_token);
  const idpOrgId = useSelector((state) => state.view.systemConfig?.idp_org_id);
  const requireIdp = useSelector((state) => !!state.view.systemConfig?.require_idp);

  const { isAuthenticated, getAccessTokenSilently, logout } = useAuth0();

  const hasHandledCallback = useRef(false);
  const sawAuth0Params = useRef(false);

  useEffect(() => {
    const ensureIdpToken = async () => {
      const hasAuth0Params = hasAuth0CallbackParams(location.search);
      // Params disappear once Auth0Provider processes the callback, so remember them.
      if (hasAuth0Params) {
        sawAuth0Params.current = true;
      }

      if (sawAuth0Params.current && isAuthenticated && !hasHandledCallback.current) {
        hasHandledCallback.current = true;

        try {
          const token = await getAccessTokenSilently({
            authorizationParams: { audience: appConfig.auth0.audience },
          });

          const safe = String(token).trim();
          if (!isValidTokenFormat(safe)) {
            console.warn('Auth token format rejected');
            navigate(`${REACT_APP_ROUTE_PREFIX}login`, { replace: true });
            return;
          }

          // Account-linking gate — common-DB path only; org-scoped (rcuksa) sites skip it.
          if (requireIdp && !idpOrgId?.trim()) {
            const { result, linkUrl } = await checkAccountLinked(safe);

            // Unlinked: hand off to the server-owned link page (always a validated URL).
            if (result === GATE_RESULT.UNLINKED) {
              redirectToExternalUrl(linkUrl);
              return;
            }

            // Unusable token: clear the SDK session + SPA token state, restart login.
            if (result === GATE_RESULT.INVALID) {
              logout({ openUrl: false }).catch(() => {});
              dispatch(clearAuth());
              navigate(`${REACT_APP_ROUTE_PREFIX}login`, { replace: true });
              return;
            }

            // Transient: keep the SDK session (unlike INVALID) for retry, surface an error.
            if (result === GATE_RESULT.TRANSIENT) {
              navigate(`${REACT_APP_ROUTE_PREFIX}login`, { replace: true, state: { authLinkingError: true } });
              return;
            }

            // A LINKED result returns no early exit and falls through to the sign-in below.
          }

          dispatch(applyAccessToken(safe));

          // Return route survives the Auth0 redirect in localStorage.
          const intendedRoute = getIntendedPostAuth0SuccessRoute();
          const returnTo = intendedRoute && !/\/login\b/.test(intendedRoute)
            ? intendedRoute
            : REACT_APP_ROUTE_PREFIX;
          clearIntendedPostAuth0SuccessRoute();

          navigate(stripAuth0Params(returnTo), { replace: true, state: { comesFromLogin: true } });
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
