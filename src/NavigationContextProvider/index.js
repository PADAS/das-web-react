import React, { createContext, useCallback, useEffect, useState } from 'react';

export const NavigationContext = createContext();

export const BLOCKER_STATES = {
  BLOCKED: 'blocked',
  PROCEEDING: 'proceeding',
  UNBLOCKED: 'unblocked',
};

const NavigationContextProvider = ({ children }) => {
  const [blockRequestIds, setBlockRequestIds] = useState([]);
  const [blockerState, setBlockerState] = useState(BLOCKER_STATES.UNBLOCKED);
  const [navigationData, setNavigationData] = useState({});

  const isNavigationBlocked = !!blockRequestIds.length;

  const blockNavigation = useCallback((newBlockRequestId) => {
    setBlockRequestIds((blockRequestIds) => [...blockRequestIds, newBlockRequestId]);
  }, []);

  const onNavigationAttemptBlocked = useCallback(() => {
    if (isNavigationBlocked) {
      setBlockerState(BLOCKER_STATES.BLOCKED);
    }
  }, [isNavigationBlocked]);

  const unblockNavigation = useCallback((blockRequestIdToRemove) => {
    setBlockRequestIds(
      (blockRequestIds) => blockRequestIds.filter((blockRequestId) => blockRequestId !== blockRequestIdToRemove)
    );
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
    if (blockerState !== BLOCKER_STATES.UNBLOCKED) {
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
