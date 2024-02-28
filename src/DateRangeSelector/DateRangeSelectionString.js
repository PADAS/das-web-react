import React from 'react';

import { calcFriendlyDurationString } from '../utils/datetime';

const DateRangeSelectionString = ({
  startDate,
  endDate,
  className = ''
}) => (
  <span className={className}>
    <strong>{calcFriendlyDurationString(startDate, endDate)}</strong>
  </span>
);

export default DateRangeSelectionString;
