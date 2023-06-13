import { useLocation } from 'react-router-dom';
import useNavigate from './useNavigate';
import { getCurrentTabFromURL } from '../utils/navigation';
import { useCallback, useMemo } from 'react';

const useNavigationSet = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationState = useMemo(() => ({
    from: location.pathname
  }), [location.pathname]);

  const goBack = useCallback(() => {
    if (location?.state?.from){
      navigate(location.state.from);
    } else {
      navigate(getCurrentTabFromURL(location.pathname));
    }
  }, [location.pathname, location?.state?.from, navigate]);

  return { location, navigate, navigationState, goBack };
};

export default useNavigationSet;
