import { useState, useEffect, useMemo, useRef } from 'react';
import isEqual from 'react-fast-compare';
import { useSelector } from 'react-redux';

import { DEVELOPMENT_FEATURE_FLAGS } from '../constants';

export const useFeatureFlag = flag =>
  useSelector(state =>
    !!state?.view?.systemConfig?.[flag]
  );

export const useDevelopmentFeatureFlag = (flag) => useMemo(() => DEVELOPMENT_FEATURE_FLAGS[flag], [flag]);

export const usePermissions = (permissionKey, ...permissions) =>  {
  const permissionSet = useSelector(state => {
    const permissionsSource = state.data.selectedUserProfile?.id ? state.data.selectedUserProfile : state.data.user;

    return permissionsSource?.permissions?.[permissionKey];
  }
  )
  || [];

  return permissions.every(item => permissionSet.includes(item));
};

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
