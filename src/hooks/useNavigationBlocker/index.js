import { useContext, useEffect, useRef } from 'react';

import { NavigationContext } from '../../NavigationContextProvider';
import { uuid } from '../../utils/string';

const useNavigationBlocker = (when) => {
  const { blocker, blockNavigation, unblockNavigation } = useContext(NavigationContext);

  const blockRequestId = useRef(uuid());

  useEffect(() => {
    if (when) {
      blockNavigation(blockRequestId.current);
    } else {
      unblockNavigation(blockRequestId.current);
    }
  }, [blockNavigation, unblockNavigation, when]);

  useEffect(() => () => unblockNavigation(blockRequestId.current), [unblockNavigation]);

  return blocker;
};

export default useNavigationBlocker;
