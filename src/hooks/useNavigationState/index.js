import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

const useNavigationState = () => {
  const location = useLocation();
  const navigationState = useMemo(() => ({
    hasHistory: !!location.key
  }), [location.key]);

  return navigationState;
};

export default useNavigationState;
