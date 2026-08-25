import React, { memo, useEffect, useRef } from 'react';

const DEFAULT_INTERVAL = 240_000;
const DEFAULT_TOLERANCE = 2_000;

const SleepDetector = ({ interval = DEFAULT_INTERVAL, onSleepDetected, tolerance = DEFAULT_TOLERANCE }) => {
  const currentTime = useRef(new Date().getTime());
  const poll = useRef(null);

  useEffect(() => {
    // Timers are throttled while the tab is hidden, so the gap they measure is
    // not a sleep. The baseline only advances on a visible check, so the gap
    // survives until the user comes back to the tab.
    const detectSleep = () => {
      if (!document.hidden) {
        const timeToSet = new Date().getTime();

        if ((timeToSet - currentTime.current) > (interval + tolerance)) {
          onSleepDetected();
        }

        currentTime.current = timeToSet;
      }
    };

    // Rebuilding the poll restarts the interval, so the check it was about to
    // make happens here.
    detectSleep();

    window.clearInterval(poll.current);
    poll.current = window.setInterval(detectSleep, interval);
    document.addEventListener('visibilitychange', detectSleep);

    return () => {
      window.clearInterval(poll.current);
      document.removeEventListener('visibilitychange', detectSleep);
    };
  }, [interval, onSleepDetected, tolerance]);

  return null;
};

export default memo(SleepDetector);
