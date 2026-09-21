import { useEffect, useState } from 'react';

const useCurrentTime = (refreshInterval) => {
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    if (refreshInterval) {
      const interval = setInterval(() => setCurrentTime(Date.now()), refreshInterval);

      return () => window.clearInterval(interval);
    }
  }, [refreshInterval]);

  return currentTime;
};

export default useCurrentTime;
