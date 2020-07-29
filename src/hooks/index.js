import { useState, useEffect } from 'react';

const useFeatureFlag = (flag) => {
  const [visible, setVisibility] = useState(!!process.env[`REACT_APP_FF_${flag}`]);

  useEffect(() => {
    setVisibility(!!process.env[`REACT_APP_FF_${flag}`]);
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

