import React, { useEffect, useRef, memo } from 'react';

const DEFAULT_INTERVAL = 240000;
const DEFAULT_TOLERANCE = 2000;

const SleepDetector = (props) => {
  const { interval = DEFAULT_INTERVAL, tolerance = DEFAULT_TOLERANCE, onSleepDetected } = props;
  const currentTime = useRef(new Date().getTime());
  const poll = useRef(null);

  useEffect(() => {
    window.clearInterval(poll.current);
    poll.current = window.setInterval(() => {
      const timeToSet = new Date().getTime();
      if ((timeToSet - currentTime.current)
        > (interval + tolerance)
        && !document.hidden
      ) {
        onSleepDetected();
      }
      currentTime.current = timeToSet;
    }, interval);
    return () => window.clearInterval(poll.current);
  }, [interval, onSleepDetected, tolerance]);
  return null;
};

export default memo(SleepDetector);
