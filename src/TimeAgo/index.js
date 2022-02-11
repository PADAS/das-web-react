import React, { useMemo, useEffect, useState, memo } from 'react';
import { generateCurrentTimeZoneTitle, durationHumanizer, HUMANIZED_DURATION_CONFIGS } from '../utils/datetime';

const title = generateCurrentTimeZoneTitle();

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND * 60;
const ONE_HOUR = ONE_MINUTE * 60;

const TimeAgo = (props) => {
  const { date, prefix = null, suffix = null, ...rest } = props;

  const [timeDistance, setTimeDistance] = useState(new Date() - new Date(date));

  const olderThanAMinute = timeDistance > ONE_MINUTE;
  const olderThanAnHour = timeDistance > ONE_HOUR;

  const durationStringGenerator = useMemo(() => {
    if (olderThanAnHour) return durationHumanizer(HUMANIZED_DURATION_CONFIGS.LONG_TERM_ABRREVIATED);
    if (olderThanAMinute) return durationHumanizer(HUMANIZED_DURATION_CONFIGS.MINUTES_ONLY);

    return durationHumanizer();
  }, [olderThanAMinute, olderThanAnHour]);

  const durationString = durationStringGenerator(timeDistance);

  useEffect(() => {
    let updateInterval;
    const intervalLength = olderThanAMinute ? ONE_MINUTE : ONE_SECOND;

    const updateFn = () => {
      setTimeDistance(new Date() - new Date(date));
    };

    updateInterval = window.setInterval(updateFn, intervalLength);

    return () => {
      window.clearInterval(updateInterval);
    };
  }, [date, olderThanAMinute]);

  return <span data-testid='time-ago' title={title} {...rest}>{prefix ? `${prefix} ` : ''}{durationString}{suffix ? ` ${suffix}` : ''}</span>;
};

export default memo(TimeAgo);