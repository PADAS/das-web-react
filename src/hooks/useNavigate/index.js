import { useCallback, useContext } from 'react';
import { useNavigate as useRouterNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { showSideBar } from '../../ducks/side-bar';

import { NavigationContext } from '../../NavigationContextProvider';

// Our own useNavigate hook so we can set or cleanup the navigation context data in every
// navigation, and show the sidebar in case we left it closed through side-bar reducer
const useNavigate = (options = {}) => {
  const { clearContext = true, dispatchShowSideBar = true } = options;

  const dispatch = useDispatch();
  const routerNavigate = useRouterNavigate();

  const { setNavigationData } = useContext(NavigationContext);

  const navigate = useCallback((to, options, navigationContextData = null) => {
    if (clearContext || navigationContextData) {
      setNavigationData(navigationContextData || {});
    }

    if (dispatchShowSideBar) {
      dispatch(showSideBar());
    }

    routerNavigate(to, options);
  }, [clearContext, dispatch, dispatchShowSideBar, routerNavigate, setNavigationData]);

  return navigate;
};

export default useNavigate;
