import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { initializeWebVitals, createUserAnalyticsData } from '../../utils/webVitals';

const useWebVitals = () => {
  const user = useSelector((state) => state.data?.user);
  const selectedUserProfile = useSelector((state) => state.data?.selectedUserProfile);
  const serverVersion = useSelector((state) => state.data?.systemStatus?.server?.version);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (user && user.id && !isInitialized.current) {
      const userContext = createUserAnalyticsData(user, selectedUserProfile, serverVersion);
      initializeWebVitals(userContext);
      isInitialized.current = true;

      if (process.env.NODE_ENV === 'development') {
        console.log('Web vitals initialized with user context:', userContext);
      }
    }
  }, [user, selectedUserProfile, serverVersion]);
};

export default useWebVitals;
