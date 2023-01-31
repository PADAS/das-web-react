import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { BLOCKER_STATES, NavigationContext } from '../NavigationContextProvider';

const Link = ({ onClick, ...rest }) => {
  const { blocker, isNavigationBlocked, onNavigationAttemptBlocked } = useContext(NavigationContext);

  const blockedEventRef = useRef();
  const linkRef = useRef();

  const [skipBlocker, setSkipBlocker] = useState(false);
  const [wasClicked, setWasClicked] = useState(false);

  const handleClick = useCallback((event) => {
    if (!skipBlocker && isNavigationBlocked) {
      event.preventDefault();

      setWasClicked(true);
      blockedEventRef.current = event;
      onNavigationAttemptBlocked();
    } else {
      onClick?.(blockedEventRef.current || event);

      setSkipBlocker(false);
      blockedEventRef.current = null;
    }
  }, [isNavigationBlocked, onClick, onNavigationAttemptBlocked, skipBlocker]);

  useEffect(() => {
    if (wasClicked && blocker.state === BLOCKER_STATES.PROCEEDING) {
      setSkipBlocker(true);
      setWasClicked(false);

      setTimeout(() => linkRef.current.click());

      blocker.reset();
    }
  }, [blocker, onNavigationAttemptBlocked, wasClicked]);

  useEffect(() => {
    if (blocker.state === BLOCKER_STATES.UNBLOCKED) {
      setWasClicked(false);
    }
  }, [blocker.state]);

  return <RouterLink onClick={handleClick} ref={linkRef} {...rest} />;
};

export default Link;
