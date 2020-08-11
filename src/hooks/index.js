import { useState, useEffect } from 'react';

import { evaluateFeatureFlag } from '../utils/feature-flags';

const useFeatureFlag = (flag) => {
  const [visible, setVisibility] = useState(evaluateFeatureFlag(flag));

  useEffect(() => {
    setVisibility(evaluateFeatureFlag(flag));
  }, [flag]);

  return visible;
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

export {
  useFeatureFlag,
  useMatchMedia,
};

