import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { initializeWebVitals, createUserAnalyticsData } from '../utils/webVitals';

const WebVitalsProvider = () => { // Initializes web vitals tracking with user context
  const user = useSelector((state) => state.data?.user);
  const selectedUserProfile = useSelector((state) => state.data?.selectedUserProfile);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (user && user.id && !isInitialized.current) {
      const userContext = createUserAnalyticsData(user, selectedUserProfile);
      initializeWebVitals(userContext);
      isInitialized.current = true;

      if (process.env.NODE_ENV === 'development') {
        console.log('Web vitals initialized with user context:', userContext);
      }
    }
  }, [user, selectedUserProfile]);

  return null;
};

export default WebVitalsProvider;
