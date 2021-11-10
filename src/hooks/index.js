import { useState, useEffect, useRef } from 'react';

import { useSelector } from 'react-redux';
import isEqual from 'react-fast-compare';

export const useFeatureFlag = flag =>
  useSelector(state =>
    !!state?.view?.systemConfig?.[flag]
  );

export const useMatchMedia = (matchMediaDef) => {
  const isClient = typeof window === 'object';

  const [isMatch, setMatchState] = useState(matchMediaDef.matches);

  useEffect(() => {
    if (!isClient) {
      return false;
    }

    const handleResize = () => {
      setMatchState(matchMediaDef.matches);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // eslint-disable-line

  return isMatch;
};

export const useDeepCompareEffect = (callback, dependencies) => {
  const valueRef = useRef();
  useEffect(() => {
    if (!isEqual(valueRef.current, dependencies)) {
      valueRef.current = dependencies;
      callback();
    }
  }, [callback, dependencies]);
};
