import React, { useCallback, memo } from 'react';
import { default as TA } from 'react-timeago';
import { generateCurrentTimeZoneTitle, humanizeDuration, TIME_AGO_FORMAT_OPTIONS  } from '../utils/datetime';

const whiteSpace = (str, space) => str.padStart(space+str.length, ' ');

const TimeAgo = (props) => {
  const { showSuffix = true, formatterFn, displayFormat, date, ...rest } = props;

  const defaultFormatter = useCallback((val, unit, suffix) => `${val}${unit === 'month' ? (val > 1) ? whiteSpace(unit.substring(0, 2).concat('s'), 1) : unit.substring(0, 2) : unit.charAt(0)}${showSuffix ? ` ${suffix}` : ''}`, [showSuffix]);

  const formatter = formatterFn || defaultFormatter;

  const olderThanAnHour = (new Date() - new Date(date)) > 3600000;

  if (olderThanAnHour && displayFormat === TIME_AGO_FORMAT_OPTIONS.PRECISE) {
    return <span>{humanizeDuration(new Date() - new Date(date))}</span>;
  }

  return <TA formatter={formatter} date={date} title={generateCurrentTimeZoneTitle()} {...rest} />;
};

export default memo(TimeAgo);