// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { POST_AUTH_SUCCESS, clearAuth } from '../ducks/auth';

// Create the context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  console.log('useAuth');
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// The provider component that wraps your app
export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  // State to track if user is logged in
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // State to track if we're still checking authentication
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication when the app starts
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Function to check if user is authenticated
  const checkAuthStatus = () => {
    // Check if there's a token in localStorage
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  };

  // Function to handle login
  const login = () => {
    // Redirect to Django Auth0 login
    const djangoUrl = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';
    const spaUrl = window.location.origin;
    const loginUrl = `${djangoUrl}/accounts/auth0/spa-login/?spa_url=${encodeURIComponent(spaUrl)}`;
    window.location.href = loginUrl;
  };

  // Function to handle logout
  const logout = () => {
    // Clear tokens from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('expires_in');

    // Update state
    setIsAuthenticated(false);

    // Clear Redux state and cookies using the clearAuth action
    dispatch(clearAuth()).then(() => {
      // Give React time to cleanup before redirecting
      // This prevents map cleanup errors during component unmounting
      setTimeout(() => {
        // Redirect to Django logout
        const djangoUrl = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';
        const logoutUrl = `${djangoUrl}/accounts/auth0/logout/`;
        window.location.href = logoutUrl;
      }, 100);
    });
  };

  // Function to handle the callback from Auth0
  const handleCallback = useCallback(() => {
    console.log('handleCallback');
    console.log('window.location.hash: ', window.location.hash);
    // Check if this is a callback from Auth0 (has tokens in URL)
    if (window.location.hash.includes('access_token')) {
      // Extract tokens from URL
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);

      const accessToken = params.get('access_token');
      const idToken = params.get('id_token');
      const tokenType = params.get('token_type');
      const expiresIn = params.get('expires_in');

      if (accessToken) {
        console.log('accessToken: ', accessToken);
        // Store tokens in localStorage
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('id_token', idToken);
        localStorage.setItem('token_type', tokenType);
        localStorage.setItem('expires_in', expiresIn);

        document.cookie = `token=${accessToken};path=/`;
        document.cookie = `temporaryAccessToken=${accessToken};path=/`;

        // Update Redux store to match traditional login
        dispatch({
          type: POST_AUTH_SUCCESS,
          payload: {
            data: {
              access_token: accessToken,
              token_type: tokenType,
              expires_in: expiresIn
            }
          }
        });

        // Update authentication state
        setIsAuthenticated(true);

        // Clear the URL hash
        window.history.replaceState({}, document.title, window.location.pathname);

        return true;
      }
    }
    return false;
  }, [dispatch]);

  // The value that will be available to all components
  const value = {
    isAuthenticated,
    isLoading,
    login,
    logout,
    handleCallback
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
