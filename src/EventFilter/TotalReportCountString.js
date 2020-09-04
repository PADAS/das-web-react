import React, { memo } from 'react';
import { connect } from 'react-redux';

import { isFilterModified } from '../utils/event-filter-strings';


const mapStateToProps = ({ data: { eventFilter } }) => ({ eventFilter });

const TotalReportCountString = ({ className, eventFilter, totalFeedEventCount, ...props } ) => {
  const { state, filter: { date_range, priority, reported_by, text } } = eventFilter;

  const filterModified = isFilterModified(state, priority, text, reported_by);

  if (!filterModified || !Boolean(totalFeedEventCount)) {
    return null;
  }

  return <span className={className || ''} style={{lineHeight: 'normal'}}>{totalFeedEventCount} results</span>
}

export default connect(mapStateToProps, null)(memo(TotalReportCountString));
