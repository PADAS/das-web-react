import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';

export const NavigationContext = createContext();

export const BLOCKER_STATES = {
  BLOCKED: 'blocked',
  PROCEEDING: 'proceeding',
  UNBLOCKED: 'unblocked',
};

const NavigationContextProvider = ({ children }) => {
  const pendingNavigationRef = useRef(null);

  const [blockerIds, setBlockerIds] = useState([]);
  const [blockerState, setBlockerState] = useState(BLOCKER_STATES.UNBLOCKED);
  const [navigationData, setNavigationData] = useState({});

  const isNavigationBlocked = blockerIds.length > 0;

  const blockNavigation = useCallback((newBlockerId) => {
    setBlockerIds((blockerIds) => [...blockerIds, newBlockerId]);
  }, []);

  const onNavigationAttemptBlocked = useCallback(() => {
    if (isNavigationBlocked) {
      setBlockerState(BLOCKER_STATES.BLOCKED);
    }
  }, [isNavigationBlocked]);

  const attemptNavigation = useCallback((performNavigation) => {
    if (isNavigationBlocked) {
      pendingNavigationRef.current = performNavigation;
      setBlockerState(BLOCKER_STATES.BLOCKED);
    } else {
      performNavigation();
    }
  }, [isNavigationBlocked]);

  const unblockNavigation = useCallback((blockerIdToRemove) => {
    setBlockerIds(
      (blockerIds) => blockerIds.filter((blockerId) => blockerId !== blockerIdToRemove)
    );
    pendingNavigationRef.current = null;
    setBlockerState(BLOCKER_STATES.UNBLOCKED);
  }, []);

  const proceed = useCallback(() => {
    if (blockerState !== BLOCKER_STATES.BLOCKED) {
      return;
    }

    const performNavigation = pendingNavigationRef.current;
    pendingNavigationRef.current = null;

    if (performNavigation) {
      setBlockerState(BLOCKER_STATES.UNBLOCKED);
      performNavigation();
    } else {
      setBlockerState(BLOCKER_STATES.PROCEEDING);
    }
  }, [blockerState]);

  const reset = useCallback(() => {
    if (blockerState !== BLOCKER_STATES.UNBLOCKED) {
      pendingNavigationRef.current = null;
      setBlockerState(BLOCKER_STATES.UNBLOCKED);
    }
  }, [blockerState]);

  const blocker = { proceed, reset, state: blockerState };

  useEffect(() => {
    if (isNavigationBlocked) {
      const onUnload = (event) => event.preventDefault();

      window.addEventListener('beforeunload', onUnload);

      return () => window.removeEventListener('beforeunload', onUnload);
    }
  }, [isNavigationBlocked]);

  const navigationContextValue = {
    blocker,
    isNavigationBlocked,
    navigationData,

    attemptNavigation,
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
