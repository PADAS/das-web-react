import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';

import appConfig from '../config';
import { registerAuthRecovery } from '../utils/auth-recovery';
import { buildAuth0AuthorizationParams } from '../utils/auth0';
import { setIntendedPostAuth0SuccessRoute } from '../utils/auth';

/**
 * Registers the live @auth0/auth0-react primitives into the shared auth-recovery unit
 * so the axios interceptor and the websocket handler can both drive token renewal.
 */
const useAuthRecovery = () => {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const { pathname, search } = useLocation();
  const idpOrgId = useSelector((state) => state.view.systemConfig?.idp_org_id);

  useEffect(() => {
    registerAuthRecovery({
      silentRenew: () => getAccessTokenSilently(),
      // Interactive MFA step-up: re-run PKCE with the challenge's acr_values/max_age. The
      // redirect navigates away, so return a never-settling promise (no premature replay).
      stepUp: async ({ acrValues, maxAge } = {}) => {
        setIntendedPostAuth0SuccessRoute(`${pathname}${search}`);
        await loginWithRedirect({
          authorizationParams: {
            ...buildAuth0AuthorizationParams(appConfig.auth0.audience, idpOrgId),
            ...(acrValues ? { acr_values: acrValues } : {}),
            ...(maxAge ? { max_age: maxAge } : {}),
          },
        });
        return new Promise(() => {});
      },
    });
  }, [getAccessTokenSilently, loginWithRedirect, idpOrgId, pathname, search]);
};

export default useAuthRecovery;
