import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { createUserAnalyticsData } from '../../utils/analytics';
import { initializeWebVitals } from '../../utils/webVitals';
import { selectActiveUser, selectIsSignedInUserLoaded } from '../../selectors/user';

const useWebVitals = () => {
  const activeUser = useSelector(selectActiveUser);
  const isSignedInUserLoaded = useSelector(selectIsSignedInUserLoaded);
  const serverVersion = useSelector((state) => state.data?.systemStatus?.server?.version);

  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current && isSignedInUserLoaded) {
      const userData = createUserAnalyticsData(activeUser, serverVersion);
      initializeWebVitals(userData);
      isInitialized.current = true;

      if (import.meta.env.DEV) {
        console.log('Web vitals initialized with user context:', userData);
      }
    }
  }, [activeUser, isSignedInUserLoaded, serverVersion]);
};

export default useWebVitals;
