import { useCallback, useContext } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate as useRouterNavigate } from 'react-router';

import { showSideBar } from '../../ducks/side-bar';

import { NavigationContext } from '../../NavigationContextProvider';

// Custom useNavigate hook to handle blocking navigation, context navigation
// data and synchronization with sidebar reducer
const useNavigate = (options = {}) => {
  const { clearContext = true, dispatchShowSideBar = true } = options;

  const dispatch = useDispatch();
  const routerNavigate = useRouterNavigate();

  const { attemptNavigation, setNavigationData } = useContext(NavigationContext);

  const navigate = useCallback((to, navigateOptions, navigationContextData = null) => {
    attemptNavigation(() => {
      if (clearContext || navigationContextData) {
        setNavigationData(navigationContextData || {});
      }

      if (dispatchShowSideBar) {
        dispatch(showSideBar());
      }

      routerNavigate(to, navigateOptions);
    });
  }, [attemptNavigation, clearContext, dispatch, dispatchShowSideBar, routerNavigate, setNavigationData]);

  return navigate;
};

export default useNavigate;
