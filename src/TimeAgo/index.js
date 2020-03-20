import React from 'react';
import { default as TA } from 'react-timeago';
import { generateCurrentTimeZoneTitle } from '../utils/datetime';

const whiteSpace = (str, space) => str.padStart(space+str.length, " ")
const formatter = (val, unit, suffix) => `${val}${unit === 'month' ? (val > 1) ? whiteSpace(unit.substring(0, 2).concat('s'), 1) : unit.substring(0, 2) : unit.charAt(0)} ${suffix}`;

const TimeAgo = (props) => <TA formatter={formatter} title={generateCurrentTimeZoneTitle()} {...props} />;

export default TimeAgo;