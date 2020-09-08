import React, { memo } from 'react';
import { connect } from 'react-redux';

import { isFilterModified } from '../utils/event-filter';


const mapStateToProps = ({ data: { eventFilter } }) => ({ eventFilter });

const TotalReportCountString = ({ className, eventFilter, totalFeedEventCount, ...props } ) => {

  const filterModified = isFilterModified(eventFilter);

  if (!filterModified || !Boolean(totalFeedEventCount)) {
    return null;
  }

  return <span className={className || ''} style={{lineHeight: 'normal'}}>{totalFeedEventCount} results</span>
}

export default connect(mapStateToProps, null)(memo(TotalReportCountString));
