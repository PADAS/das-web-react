import React, { createContext, useCallback, useState } from 'react';

export const NavigationContext = createContext();

const NavigationContextProvider = ({ children }) => {
  const [isNavigationAttemptPending, setIsNavigationAttemptPending] = useState(false);
  const [isNavigationBlocked, setIsNavigationBlocked] = useState(false);
  const [navigationAttemptResolution, setNavigationAttemptResolution] = useState(null);
  const [navigationData, setNavigationData] = useState({});

  const blockNavigation = useCallback(() => setIsNavigationBlocked(true), []);

  const cancelNavigationAttempt = useCallback(() => {
    if (isNavigationAttemptPending) {
      setNavigationAttemptResolution(false);
    }
  }, [isNavigationAttemptPending]);

  const continueNavigationAttempt = useCallback(() => {
    if (isNavigationAttemptPending) {
      setNavigationAttemptResolution(true);
    }
  }, [isNavigationAttemptPending]);

  const navigationAttemptBlocked = useCallback(() => {
    if (isNavigationBlocked) {
      setIsNavigationAttemptPending(true);
    }
  }, [isNavigationBlocked]);

  const navigationAttemptUnblocked = useCallback(() => {
    setIsNavigationAttemptPending(false);
    setNavigationAttemptResolution(null);
  }, []);

  const unblockNavigation = useCallback(() => {
    setIsNavigationAttemptPending(false);
    setIsNavigationBlocked(false);
    setNavigationAttemptResolution(null);
  }, []);

  const navigationContextValue = {
    isNavigationAttemptPending,
    isNavigationBlocked,
    navigationAttemptResolution,
    navigationData,

    blockNavigation,
    cancelNavigationAttempt,
    continueNavigationAttempt,
    navigationAttemptBlocked,
    navigationAttemptUnblocked,
    unblockNavigation,

    setNavigationData,
  };

  return <NavigationContext.Provider value={navigationContextValue}>
    {children}
  </NavigationContext.Provider>;
};

export default NavigationContextProvider;
