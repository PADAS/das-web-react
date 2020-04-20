import React from 'react';

import { calcFriendlyDurationString } from '../utils/datetime';

const DateRangeSelectionString = (props) => {
  const { startDate, endDate, className, showLocationLabel } = props;

  const reportText = showLocationLabel ? 'Show reports and locations' : 'Show reports';

  return <span className={className || ''}>{reportText} from <strong>{calcFriendlyDurationString(startDate, endDate)}</strong></span>;
};

export default DateRangeSelectionString;