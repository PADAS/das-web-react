import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

import { registerAuthRecovery } from '../utils/auth-recovery';

/**
 * Registers the live @auth0/auth0-react primitives into the shared auth-recovery unit
 * so the axios interceptor and the websocket handler can both drive token renewal.
 */
const useAuthRecovery = () => {
  const { getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    registerAuthRecovery({ silentRenew: () => getAccessTokenSilently() });
  }, [getAccessTokenSilently]);
};

export default useAuthRecovery;
