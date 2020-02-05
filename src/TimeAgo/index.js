import React from 'react';
import { default as TA } from 'react-timeago';
import { generateCurrentTimeZoneTitle } from '../utils/datetime';

const formatter = (val, unit, suffix) => `${val}${unit === 'month' ? unit.substring(0, 2) : unit.charAt(0)} ${suffix}`;

const TimeAgo = (props) => <TA formatter={formatter} title={generateCurrentTimeZoneTitle()} {...props} />;

export default TimeAgo;