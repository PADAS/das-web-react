import React, { createContext, useCallback, useEffect, useState } from 'react';

export const NavigationContext = createContext();

export const BLOCKER_STATES = {
  BLOCKED: 'blocked',
  PROCEEDING: 'proceeding',
  UNBLOCKED: 'unblocked',
};

const NavigationContextProvider = ({ children }) => {
  const [blockerState, setBlockerState] = useState(BLOCKER_STATES.UNBLOCKED);
  const [isNavigationBlocked, setIsNavigationBlocked] = useState(false);
  const [navigationData, setNavigationData] = useState({});

  const blockNavigation = useCallback(() => setIsNavigationBlocked(true), []);

  const onNavigationAttemptBlocked = useCallback(() => {
    if (isNavigationBlocked) {
      setBlockerState(BLOCKER_STATES.BLOCKED);
    }
  }, [isNavigationBlocked]);

  const unblockNavigation = useCallback(() => {
    setIsNavigationBlocked(false);
    setBlockerState(BLOCKER_STATES.UNBLOCKED);
  }, []);

  useEffect(() => {
    if (isNavigationBlocked) {
      const onUnload = (event) => {
        event.returnValue = 'Would you like to discard changes?';
      };
      window.addEventListener('beforeunload', onUnload);

      return () => {
        window.removeEventListener('beforeunload', onUnload);
      };
    }
  }, [isNavigationBlocked]);

  const proceed = useCallback(() => {
    if (blockerState === BLOCKER_STATES.BLOCKED) {
      setBlockerState(BLOCKER_STATES.PROCEEDING);
    }
  }, [blockerState]);

  const reset = useCallback(() => {
    if (blockerState === BLOCKER_STATES.BLOCKED) {
      setBlockerState(BLOCKER_STATES.UNBLOCKED);
    }
  }, [blockerState]);

  const blocker = { proceed, reset, state: blockerState };

  const navigationContextValue = {
    blocker,
    isNavigationBlocked,
    navigationData,

    blockNavigation,
    onNavigationAttemptBlocked,
    setNavigationData,
    unblockNavigation,
  };

  return <NavigationContext.Provider value={navigationContextValue}>
    {children}
  </NavigationContext.Provider>;
};

export default NavigationContextProvider;
