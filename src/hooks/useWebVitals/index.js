import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { initializeWebVitals } from '../../utils/webVitals';
import { createUserAnalyticsData } from '../../utils/analytics';

const useWebVitals = () => {
  const user = useSelector((state) => state.data?.user);
  const selectedUserProfile = useSelector((state) => state.data?.selectedUserProfile);
  const serverVersion = useSelector((state) => state.data?.systemStatus?.server?.version);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current && user?.id) {
      const userData = createUserAnalyticsData(user, selectedUserProfile, serverVersion);
      initializeWebVitals(userData);
      isInitialized.current = true;

      if (process.env.NODE_ENV === 'development') {
        console.log('Web vitals initialized with user context:', userData);
      }
    }
  }, [user, selectedUserProfile, serverVersion]);
};

export default useWebVitals;
