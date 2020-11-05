import React, { useCallback } from 'react';
import { default as TA } from 'react-timeago';
import { generateCurrentTimeZoneTitle } from '../utils/datetime';

const whiteSpace = (str, space) => str.padStart(space+str.length, ' ');
const formatter = (val, unit, suffix) => `${val}${unit === 'month' ? (val > 1) ? whiteSpace(unit.substring(0, 2).concat('s'), 1) : unit.substring(0, 2) : unit.charAt(0)} ${suffix}`;

const TimeAgo = (props) => {
  const { showSuffix = true, ...rest } = props;

  const formatter = useCallback((val, unit, suffix) =>
    `${val}${unit === 'month' ? (val > 1) ? whiteSpace(unit.substring(0, 2).concat('s'), 1) : unit.substring(0, 2) : unit.charAt(0)}${showSuffix ? ` ${suffix}` : ''}`,
  [showSuffix]);

  return <TA formatter={formatter} title={generateCurrentTimeZoneTitle()} {...rest} />;
};

export default TimeAgo;