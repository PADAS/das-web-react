import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useDispatch, useSelector } from 'react-redux';
import { POST_AUTH_SUCCESS } from '../ducks/auth';
import LoadingOverlay from '../EarthRangerIconLoadingOverlay';

const Auth0TokenManager = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const existingToken = useSelector((state) => state.data.token?.access_token);
  const systemConfig = useSelector((state) => state.view.systemConfig);
  const requireIdp = !!systemConfig?.require_idp;
  const [tokenReady, setTokenReady] = useState(false);

  useEffect(() => {
    const acquireToken = async () => {
      // Wait for system config to load (sitename is '' in initial state)
      const configLoaded = systemConfig?.sitename !== '';
      if (!configLoaded) return;

      // Not in IDP mode - skip Auth0 token logic
      if (!requireIdp) {
        setTokenReady(true);
        return;
      }

      // Wait for Auth0 SDK to finish initializing
      if (isLoading) return;

      // Already have token in Redux - we're done
      if (existingToken) {
        setTokenReady(true);
        return;
      }

      // Not authenticated with Auth0 - let routing handle redirect to login
      if (!isAuthenticated) {
        setTokenReady(true);
        return;
      }

      // Authenticated with Auth0 but no token in Redux - acquire it!
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: process.env.REACT_APP_AUTH0_AUDIENCE,
          },
        });

        const safe = String(token).trim();
        if (!/^[A-Za-z0-9._-]+$/.test(safe)) {
          console.warn('Auth token format rejected');
          setTokenReady(true);
          return;
        }

        document.cookie = `token=${safe};path=/`;
        dispatch({ type: POST_AUTH_SUCCESS, payload: { data: { access_token: safe } } });

        // Delay setTokenReady to give Auth0NavigationManager time to navigate
        // This keeps the LoadingOverlay visible during navigation
        setTimeout(() => setTokenReady(true), 100);
      } catch (e) {
        console.error('Token acquisition failed:', e);
        setTokenReady(true);
      }
    };

    acquireToken();
  }, [dispatch, existingToken, getAccessTokenSilently, isAuthenticated, isLoading, requireIdp, systemConfig]);

  // Show loading overlay while determining token status in IDP mode
  if (!tokenReady && requireIdp) {
    return <LoadingOverlay />;
  }

  return null;
};

export default Auth0TokenManager;
