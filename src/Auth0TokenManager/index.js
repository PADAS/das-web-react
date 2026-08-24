import { useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';

import { APP_ROUTES } from '../constants/routes';
import appConfig from '../config';
import { REACT_APP_ROUTE_PREFIX } from '../constants';
import { applyAccessToken, clearAuth } from '../ducks/auth';
import { checkAccountLinked, GATE_RESULT } from '../utils/account-linking';
import {
  clearIntendedPostAuth0SuccessRoute,
  getIntendedPostAuth0SuccessRoute,
  isValidTokenFormat,
  markLocalUserNotProvisioned,
  stripAuth0Params,
  takeLocalUserLoginAttempt,
} from '../utils/auth';
import { hasAuth0CallbackParams } from '../utils/auth0';
import { redirectToExternalUrl } from '../utils/navigation';
import useNavigate from '../hooks/useNavigate';

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

        // Consumed once per processed callback so a marker cannot outlive its
        // attempt. Read before the try so every failure below can say which path
        // the user was on, rather than leaving them a message that hides it.
        const attemptedLocalUserLogin = takeLocalUserLoginAttempt();
        const failedLoginOptions = attemptedLocalUserLogin
          ? { replace: true, state: { localUserSignInFailed: true } }
          : { replace: true };

        try {
          const token = await getAccessTokenSilently({
            authorizationParams: { audience: appConfig.auth0.audience },
          });

          const safe = String(token).trim();
          if (!isValidTokenFormat(safe)) {
            console.warn('Auth token format rejected');
            navigate(APP_ROUTES.LOGIN, failedLoginOptions);
            return;
          }

          // Account-linking gate — common-DB path only; org-scoped (rcuksa) sites skip it.
          if (requireIdp && !idpOrgId?.trim()) {
            const { result, linkUrl } = await checkAccountLinked(safe);

            if (result === GATE_RESULT.UNLINKED) {
              // The link page's on-ramp is a legacy username and password, which a
              // local user does not have, so sending them there is a dead end. Stop
              // here instead: the Auth0 session is fine, the ER mapping is missing.
              if (attemptedLocalUserLogin) {
                // End the Auth0 session itself, not just the local cache. The
                // tenant cookie outlives this page, so anything less lets the next
                // sign-in — from a bookmark, a new tab, either button — silently
                // reuse this unusable identity and reach the link page after all.
                // The redirect leaves the app, so the reason travels in session
                // storage rather than router state.
                //
                // Awaited so a failure lands in the catch below rather than as an
                // unhandled rejection: the SDK clears its local session before
                // redirecting, so a half-completed logout leaves the tenant session
                // alive, and returning here would strand the user on the callback
                // URL, where the token guard holds its overlay indefinitely.
                markLocalUserNotProvisioned();
                dispatch(clearAuth());
                await logout({
                  logoutParams: {
                    returnTo: `${window.location.origin}${REACT_APP_ROUTE_PREFIX}`,
                  },
                });
                return;
              }

              // Unlinked: hand off to the server-owned link page (always a validated URL).
              redirectToExternalUrl(linkUrl);
              return;
            }

            // Unusable token: clear the SDK session + SPA token state, restart login.
            if (result === GATE_RESULT.INVALID) {
              logout({ openUrl: false }).catch(() => {});
              dispatch(clearAuth());
              navigate(APP_ROUTES.LOGIN, failedLoginOptions);
              return;
            }

            // Transient: keep the SDK session (unlike INVALID) for retry, surface an error.
            if (result === GATE_RESULT.TRANSIENT) {
              navigate(APP_ROUTES.LOGIN, {
                replace: true,
                state: attemptedLocalUserLogin
                  ? { localUserSignInFailed: true }
                  : { authLinkingError: true },
              });
              return;
            }

            // A LINKED result returns no early exit and falls through to the sign-in below.
          }

          dispatch(applyAccessToken(safe));

          // Return route survives the Auth0 redirect in localStorage.
          const intendedRoute = getIntendedPostAuth0SuccessRoute();
          const returnTo = intendedRoute && !/\/login\b/.test(intendedRoute)
            ? intendedRoute
            : APP_ROUTES.ROOT;
          clearIntendedPostAuth0SuccessRoute();

          navigate(stripAuth0Params(returnTo), { replace: true, state: { comesFromLogin: true } });
        } catch (e) {
          console.error('Auth0 callback failed:', e);
          navigate(APP_ROUTES.LOGIN, failedLoginOptions);
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
