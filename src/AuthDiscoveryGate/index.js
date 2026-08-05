import React, { useEffect } from 'react';
import { Auth0Provider } from '@auth0/auth0-react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import {
  fetchAuthDiscovery,
  GRANT,
  restoreAuthDiscovery,
} from '../ducks/auth-discovery';
import { fetchSystemStatus } from '../ducks/system-status';
import { isSystemConfigLoaded } from '../utils/auth';
import { hasAuth0CallbackParams } from '../utils/auth0';
import { DAS_HOST, REACT_APP_ROUTE_PREFIX } from '../constants';
import ErrorMessage from '../ErrorMessage';
import LoadingOverlay from '../EarthRangerIconLoadingOverlay';

// Auth0Provider wants a host, while discovery names the authorization server by issuer.
const hostOf = (authorizationServer) => new URL(authorizationServer).host;

const AuthDiscoveryGate = ({ children }) => {
  const dispatch = useDispatch();
  // The 'login' namespace is preloaded, unlike 'errors'; this screen is the app's first render,
  // so a namespace fetched on demand would show the key or the fallback about as often as the
  // translation. defaultValue still covers a cold cache.
  const { t } = useTranslation('login');

  const { discovery, settled } = useSelector((state) => state.view.authDiscovery);
  const systemConfigLoaded = useSelector((state) => isSystemConfigLoaded(state.view.systemConfig));

  // Both in flight together. Neither answer depends on the other and startup waits on both,
  // so firing them in series would add a round trip to every cold load.
  useEffect(() => {
    // Returning from the Auth0 redirect, prefer the resolution stashed on the way out. The SDK
    // needs its provider mounted to exchange ?code&state, and a probe that failed here would
    // spend the code for nothing. Only when there is no stash does this leg probe.
    const resolveDiscovery = async () => {
      const restored = hasAuth0CallbackParams(window.location.search)
        && await dispatch(restoreAuthDiscovery());

      if (!restored) dispatch(fetchAuthDiscovery());
    };

    resolveDiscovery();
    dispatch(fetchSystemStatus());
  }, [dispatch]);

  // A system config that never arrives holds the overlay indefinitely, as it did before this
  // gate existed: fetchSystemStatus swallows its own errors and resolves undefined, so a
  // caller cannot tell failure from a slow answer. Worth fixing, but not from here -- App.js
  // consumes the same thunk's resolved value.
  if (!settled || !systemConfigLoaded) return <LoadingOverlay />;

  // One message for every reason: refreshing or finding an administrator is the whole of what
  // the reader can do. Which reason it was is in the console, for whoever debugs it.
  if (!discovery.ok) {
    return <ErrorMessage message={t('signInUnavailable', {
      defaultValue: 'EarthRanger could not work out how to sign you in to {{site}}. Refresh to try again, and contact your administrator if it keeps happening.',
      site: hostOf(DAS_HOST),
    })} />;
  }

  // Only the redirect grant needs a provider above the app. The password grant is served
  // by the site's own authorization server, which the SDK plays no part in.
  if (discovery.grant !== GRANT.AUTHORIZATION_CODE) return children;

  return <Auth0Provider
    cacheLocation="localstorage"
    clientId={discovery.clientId}
    domain={hostOf(discovery.issuer)}
    useRefreshTokens={true}
    authorizationParams={{
      audience: discovery.audience,
      redirect_uri: `${window.location.origin}${REACT_APP_ROUTE_PREFIX}`,
    }}
    >
    {children}
  </Auth0Provider>;
};

export default AuthDiscoveryGate;
