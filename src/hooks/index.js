import { useState, useEffect } from 'react';

const evaluateFeatureFlag = flag => {
  if (!process.env[`REACT_APP_FF_${flag}`]) return false;
  if (process.env[`REACT_APP_FF_${flag}`] === 'true') return true; /* bool-to-string interpolations for production build idiosyncracies */
  if (process.env[`REACT_APP_FF_${flag}`] === 'false') return false;
  return process.env[`REACT_APP_FF_${flag}`];
};

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

