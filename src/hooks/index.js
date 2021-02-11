import { useState, useEffect, useRef } from 'react';
import isEqual from 'react-fast-compare';

import { useSelector } from 'react-redux';

const useFeatureFlag = flag => 
  useSelector(state =>
    !!state?.view?.systemConfig?.[flag]
  );

const usePermissions = (permissionKey, ...permissions) =>  {
  const permissionSet = useSelector(state => {
    return state?.data?.user?.permissions?.[permissionKey];
  }
  )
  || [];

  return permissions.every(item => permissionSet.includes(item));
};

const useMatchMedia = (matchMediaDef) => {
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
  const valueRef = useRef(dependencies);
  
  useEffect(() => {
    if (!isEqual(valueRef.current, dependencies)) {
      valueRef.current = dependencies;
      callback();
    }
  }, [callback, dependencies]);

};

export {
  useFeatureFlag,
  usePermissions,
  useMatchMedia,
};

