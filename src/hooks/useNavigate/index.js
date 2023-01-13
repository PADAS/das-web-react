import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate as useRouterNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { showSideBar } from '../../ducks/side-bar';

import { NavigationContext } from '../../NavigationContextProvider';

// Custom useNavigate hook to handle blocking navigation, context navigation
// data and synchronization with sidebar reducer
const useNavigate = (options = {}) => {
  const { clearContext = true, dispatchShowSideBar = true } = options;

  const dispatch = useDispatch();
  const routerNavigate = useRouterNavigate();

  const {
    isNavigationBlocked,
    navigationAttemptBlocked,
    navigationAttemptResolution,
    navigationAttemptUnblocked,
    setNavigationData,
  } = useContext(NavigationContext);

  const [navigationAttemptParameters, setNavigationAttemptParameters] = useState(null);

  const navigate = useCallback((to, options, navigationContextData = null, unblocked = false) => {
    if (!unblocked && isNavigationBlocked) {
      setNavigationAttemptParameters({ to, options, navigationContextData });
      navigationAttemptBlocked();
    } else {
      if (clearContext || navigationContextData) {
        setNavigationData(navigationContextData || {});
      }

      if (dispatchShowSideBar) {
        dispatch(showSideBar());
      }

      routerNavigate(to, options);
    }
  }, [
    clearContext,
    dispatch,
    dispatchShowSideBar,
    isNavigationBlocked,
    navigationAttemptBlocked,
    routerNavigate,
    setNavigationData,
  ]);

  useEffect(() => {
    if (navigationAttemptResolution !== null) {
      if (navigationAttemptResolution && navigationAttemptParameters) {
        navigate(
          navigationAttemptParameters.to,
          navigationAttemptParameters.options,
          navigationAttemptParameters.navigationContextData,
          true
        );
      }

      setNavigationAttemptParameters(null);
      navigationAttemptUnblocked();
    }
  }, [navigationAttemptParameters, navigationAttemptResolution, navigate, navigationAttemptUnblocked]);

  return navigate;
};

export default useNavigate;
