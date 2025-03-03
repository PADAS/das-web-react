import { useContext, useState, useEffect, useRef } from 'react';
import isEqual from 'react-fast-compare';
import { useSelector } from 'react-redux';
import noop from 'lodash/noop';


import { MapContext } from '../App';

import { DEVELOPMENT_FEATURE_FLAGS } from '../constants';

export const useSystemConfigFlag = (flag) => useSelector((state) => !!state?.view?.systemConfig?.[flag]);

export const useFeatureFlag = (flagName) => {
  const featureFlagOverrides = useSelector(state =>
    state.view.featureFlagOverrides
  );

  if (!DEVELOPMENT_FEATURE_FLAGS.hasOwnProperty(flagName)) {
    throw new Error('no feature flag with that name exists');
  }

  return featureFlagOverrides.hasOwnProperty(flagName)
    ? featureFlagOverrides[flagName].value
    : DEVELOPMENT_FEATURE_FLAGS[flagName];
};


export const usePermissions = (permissionKey, ...permissions) => {
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

export const useMapEventBinding = (eventType = 'click', handlerFn = noop, layerId = null, condition = true) => {
  const map = useContext(MapContext);

  useEffect(() => {
    const args = [eventType, layerId, handlerFn].filter(item => !!item);

    if (map && condition) {
      map.on(...args);
    }

    return () => {
      map?.off?.(...args);
    };
  }, [map, condition, eventType, layerId, handlerFn]);
};

export const useMemoCompare = (next, compare = isEqual) => {
  const previousRef = useRef();
  const previous = previousRef.current;

  const isEqual = compare(previous, next);

  useEffect(() => {
    if (!isEqual) {
      previousRef.current = next;
    }
  }, [isEqual, next]);

  return isEqual ? previous : next;
};
