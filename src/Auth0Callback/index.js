import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth, AuthProvider } from '../AuthContext';
import { REACT_APP_ROUTE_PREFIX } from '../constants';
import LoadingOverlay from '../EarthRangerIconLoadingOverlay';

const Auth0Callback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { handleCallback } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Only process the callback once
    if (hasProcessed.current) {
      return;
    }

    // Check if we have tokens in the hash
    const hash = location.hash || window.location.hash;
    if (!hash.includes('access_token')) {
      // No tokens found - redirect to login with error
      navigate(`${REACT_APP_ROUTE_PREFIX}login?error=auth0_callback_failed`);
      return;
    }

    // Mark as processed to prevent double execution
    hasProcessed.current = true;

    // Handle the Auth0 callback
    try {
      const success = handleCallback();
      if (success) {
        // Success - redirect to main app
        navigate(REACT_APP_ROUTE_PREFIX);
      } else {
        // No tokens found - redirect to login with error
        navigate(`${REACT_APP_ROUTE_PREFIX}login?error=auth0_callback_failed`);
      }
    } catch (error) {
      console.error('Auth0 callback error:', error);
      // Redirect to login with error
      navigate(`${REACT_APP_ROUTE_PREFIX}login?error=auth0_callback_failed`);
    }
  }, [location.hash, handleCallback, navigate]);

  return <LoadingOverlay />;
};

const Auth0CallbackWithContext = () =>
  <AuthProvider>
    <Auth0Callback />
  </AuthProvider>;

export default Auth0CallbackWithContext;

