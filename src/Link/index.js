import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { NavigationContext } from '../NavigationContextProvider';

const Link = ({ onClick, ...rest }) => {
  const {
    isNavigationBlocked,
    navigationAttemptBlocked,
    navigationAttemptResolution,
    navigationAttemptUnblocked,
  } = useContext(NavigationContext);

  const linkRef = useRef();

  const [localNavigationAttemptBlocked, setLocalNavigationAttemptBlocked] = useState(false);
  const [localNavigationUnblocked, setLocalNavigationUnblocked] = useState(false);

  const handleClick = useCallback((event) => {
    if (!localNavigationUnblocked && isNavigationBlocked) {
      event.preventDefault();

      setLocalNavigationAttemptBlocked(true);
      navigationAttemptBlocked();
    } else {
      onClick?.(event);
      setLocalNavigationUnblocked(false);
    }
  }, [isNavigationBlocked, localNavigationUnblocked, navigationAttemptBlocked, onClick]);

  useEffect(() => {
    if (localNavigationAttemptBlocked && navigationAttemptResolution !== null) {
      if (navigationAttemptResolution) {
        setLocalNavigationUnblocked(true);
        setTimeout(() => linkRef.current.click());
      }

      setLocalNavigationAttemptBlocked(false);
      navigationAttemptUnblocked();
    }
  }, [localNavigationAttemptBlocked, navigationAttemptResolution, navigationAttemptUnblocked]);

  return <RouterLink onClick={handleClick} ref={linkRef} {...rest} />;
};

export default Link;
