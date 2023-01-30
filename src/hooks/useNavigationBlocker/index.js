import { useContext, useEffect } from 'react';

import { NavigationContext } from '../../NavigationContextProvider';

const useNavigationBlocker = (when) => {
  const { blocker, blockNavigation, unblockNavigation } = useContext(NavigationContext);

  useEffect(() => {
    if (when) {
      blockNavigation();
    } else {
      unblockNavigation();
    }
  }, [blockNavigation, unblockNavigation, when]);

  useEffect(() => unblockNavigation, [unblockNavigation]);

  return blocker;
};

export default useNavigationBlocker;
