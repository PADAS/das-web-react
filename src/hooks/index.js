import { useState, useEffect } from 'react';

import { useSelector } from 'react-redux';

const useFeatureFlag = flag => 
  useSelector(state =>
    !!state?.view?.systemConfig?.[flag]
  );

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

