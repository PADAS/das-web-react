import { useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { showSideBar } from '../../ducks/side-bar';

import { NavigationContext } from '../../NavigationContextProvider';

// Our own useNavigate hook so we can set or cleanup the navigation context data in every
// navigation, and show the sidebar in case we left it closed through side-bar reducer
const useERNavigate = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { setNavigationData } = useContext(NavigationContext);

  const earthRangerNavigate = useCallback((to, options, navigationContextData = {}) => {
    setNavigationData(navigationContextData);
    dispatch(showSideBar());
    navigate(to, options);
  }, [dispatch, navigate, setNavigationData]);

  return earthRangerNavigate;
};

export default useERNavigate;
