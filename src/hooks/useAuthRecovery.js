import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';

import { selectResolution } from '../ducks/auth-discovery';
import { registerAuthRecovery } from '../utils/auth-recovery';
import { setIntendedPostAuth0SuccessRoute, setResolvedIssuer } from '../utils/auth';

/**
 * Registers the live @auth0/auth0-react primitives into the shared auth-recovery unit
 * so the axios interceptor and the websocket handler can both drive token renewal.
 */
const useAuthRecovery = () => {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const { pathname, search } = useLocation();
  const { audience, issuer } = useSelector(selectResolution);

  useEffect(() => {
    registerAuthRecovery({
      silentRenew: () => getAccessTokenSilently(),
      // Interactive MFA step-up: re-run PKCE with the challenge's acr_values/max_age. The
      // redirect navigates away, so return a never-settling promise (no premature replay).
      stepUp: async ({ acrValues, maxAge } = {}) => {
        setIntendedPostAuth0SuccessRoute(`${pathname}${search}`);
        setResolvedIssuer(issuer);
        await loginWithRedirect({
          authorizationParams: {
            audience,
            ...(acrValues ? { acr_values: acrValues } : {}),
            ...(maxAge ? { max_age: maxAge } : {}),
          },
        });
        return new Promise(() => {});
      },
    });
  }, [audience, getAccessTokenSilently, issuer, loginWithRedirect, pathname, search]);
};

export default useAuthRecovery;
