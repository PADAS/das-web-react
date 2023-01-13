import { useContext, useEffect } from 'react';

import { NavigationContext } from '../../NavigationContextProvider';

const useBlockNavigation = (when) => {
  const {
    blockNavigation,
    cancelNavigationAttempt,
    continueNavigationAttempt,
    isNavigationAttemptPending,
    unblockNavigation,
  } = useContext(NavigationContext);

  useEffect(() => {
    if (when) {
      blockNavigation();
    } else {
      unblockNavigation();
    }
  }, [blockNavigation, unblockNavigation, when]);

  useEffect(() => unblockNavigation, [unblockNavigation]);

  return { cancelNavigationAttempt, continueNavigationAttempt, isNavigationAttemptPending };
};

export default useBlockNavigation;
