import React, { useMemo, useEffect, useRef, useState, memo } from 'react';
import { generateCurrentTimeZoneTitle, durationHumanizer, HUMANIZED_DURATION_CONFIGS } from '../utils/datetime';

const title = generateCurrentTimeZoneTitle();

const ONE_MINUTE_IN_MS = 60000;
const ONE_HOUR_IN_MS = ONE_MINUTE_IN_MS * 60;

const TimeAgo = (props) => {
  const { date, prefix = null, suffix = null, ...rest } = props;

  const [timeDistance, setTimeDistance] = useState(new Date() - new Date(date));
  const updateIntervalRef = useRef(null);

  const olderThanAMinute = timeDistance > ONE_MINUTE_IN_MS;
  const olderThanAnHour = timeDistance > ONE_HOUR_IN_MS;

  const durationStringGenerator = useMemo(() => {
    if (olderThanAnHour) return durationHumanizer(HUMANIZED_DURATION_CONFIGS.LONG_TERM_ABRREVIATED);
    if (olderThanAMinute) return durationHumanizer(HUMANIZED_DURATION_CONFIGS.MINUTES_ONLY);

    return durationHumanizer(HUMANIZED_DURATION_CONFIGS.ABBREVIATED_FORMAT);
  }, [olderThanAMinute, olderThanAnHour]);

  const durationString = durationStringGenerator(timeDistance);

  useEffect(() => {
    const updateFn = () => {
      setTimeDistance(new Date() - new Date(date));
    };

    const intervalLength = olderThanAMinute ? 60000 : 1000;

    updateIntervalRef.current = window.setInterval(updateFn, intervalLength);

    return () => {
      window.clearInterval(updateIntervalRef.current);
    };
  }, [date, olderThanAMinute]);

  return <span title={title} {...rest}>{prefix ? `${prefix} ` : ''}{durationString}{suffix ? ` ${suffix}` : ''}</span>;
};

export default memo(TimeAgo);