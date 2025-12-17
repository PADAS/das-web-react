import { useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useSelector } from 'react-redux';
import useNavigate from '../hooks/useNavigate';
import { REACT_APP_ROUTE_PREFIX } from '../constants';

const Auth0NavigationManager = () => {
  const { isLoading, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  const hasNavigated = useRef(false);
  const previouslyAuthenticated = useRef(false);
  const existingToken = useSelector((state) => state.data.token?.access_token);
  const systemConfig = useSelector((state) => state.view.systemConfig);
  const requireIdp = !!systemConfig?.require_idp;

  useEffect(() => {
    console.log('[Auth0NavigationManager] Effect', {
      systemConfig: !!systemConfig,
      requireIdp,
      hasNavigated: hasNavigated.current,
      isLoading,
      isAuthenticated,
      wasAuth: previouslyAuthenticated.current,
      hasToken: !!existingToken
    });

    // Wait for system config to load before making decisions
    if (!systemConfig) return;

    // Only handle Auth0 OAuth callbacks when in IDP mode
    if (!requireIdp) return;

    // Only navigate once
    if (hasNavigated.current) return;

    // Wait for Auth0 to finish loading
    if (isLoading) return;

    // Check if we just completed Auth0 login
    const justAuthenticated = isAuthenticated && !previouslyAuthenticated.current;

    // If we just authenticated and have the token, navigate
    if (justAuthenticated && existingToken) {
      console.log('[Auth0NavigationManager] Just logged in - navigating!');
      hasNavigated.current = true;
      previouslyAuthenticated.current = true;

      // Get intended destination
      let storedIntended = null;
      try { storedIntended = localStorage.getItem('er:intended_route'); } catch (_) {}

      const rawTarget = storedIntended || REACT_APP_ROUTE_PREFIX;

      // Parse pathname and search params
      const [pathname, searchString] = rawTarget.split('?');
      const targetPath = /\/login\b/.test(pathname) ? REACT_APP_ROUTE_PREFIX : pathname;

      // Clean up stored route
      try { localStorage.removeItem('er:intended_route'); } catch (_) {}

      // Strip OAuth params (code, state) while preserving other query params
      let cleanSearch = '';
      if (searchString) {
        const params = new URLSearchParams(searchString);
        params.delete('code');
        params.delete('state');
        const remaining = params.toString();
        if (remaining) {
          cleanSearch = `?${remaining}`;
        }
      }

      // Navigate with cleaned pathname and search params
      console.log('[Auth0NavigationManager] Executing navigation to:', targetPath, cleanSearch);
      navigate(
        targetPath + cleanSearch,
        { replace: true, state: { comesFromLogin: true } }
      );
    }

    // Track authentication state (only update when not authenticated, to preserve detection)
    if (!isAuthenticated) {
      previouslyAuthenticated.current = false;
    }
  }, [systemConfig, requireIdp, isLoading, isAuthenticated, existingToken, navigate]);

  return null;
};

export default Auth0NavigationManager;
