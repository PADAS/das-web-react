import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate as useRouterNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { showSideBar } from '../../ducks/side-bar';

import { BLOCKER_STATES, NavigationContext } from '../../NavigationContextProvider';

// Custom useNavigate hook to handle blocking navigation, context navigation
// data and synchronization with sidebar reducer
const useNavigate = (options = {}) => {
  const { clearContext = true, dispatchShowSideBar = true } = options;

  const dispatch = useDispatch();
  const routerNavigate = useRouterNavigate();

  const {
    blocker,
    isNavigationBlocked,
    onNavigationAttemptBlocked,
    setNavigationData,
  } = useContext(NavigationContext);

  const [navigationAttemptParameters, setNavigationAttemptParameters] = useState(null);

  const navigate = useCallback((to, options, navigationContextData = null, skipBlocker = false) => {
    if (!skipBlocker && isNavigationBlocked) {
      setNavigationAttemptParameters({ to, options, navigationContextData });
      onNavigationAttemptBlocked();
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
    onNavigationAttemptBlocked,
    setNavigationData,
    routerNavigate,
  ]);

  useEffect(() => {
    if (blocker.state === BLOCKER_STATES.PROCEEDING && navigationAttemptParameters) {
      navigate(
        navigationAttemptParameters.to,
        navigationAttemptParameters.options,
        navigationAttemptParameters.navigationContextData,
        true
      );

      blocker.reset();
    }
  }, [blocker, navigate, navigationAttemptParameters]);

  useEffect(() => {
    if (blocker.state === BLOCKER_STATES.UNBLOCKED) {
      setNavigationAttemptParameters(null);
    }
  }, [blocker.state]);

  return navigate;
};

export default useNavigate;
