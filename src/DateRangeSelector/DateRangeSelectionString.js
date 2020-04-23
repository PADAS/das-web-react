import React from 'react';

import { calcFriendlyDurationString } from '../utils/datetime';

const DateRangeSelectionString = (props) => {
  const { startDate, endDate, className } = props;

  return <span className={className || ''}>Show reports from <strong>{calcFriendlyDurationString(startDate, endDate)}</strong></span>;
};

export default DateRangeSelectionString;