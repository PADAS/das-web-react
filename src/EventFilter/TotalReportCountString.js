import React, { memo } from 'react';
import { connect } from 'react-redux';


const mapStateToProps = ({ data: { eventFilter } }) => ({ eventFilter });

const TotalReportCountString = ({ className, eventFilter, totalFeedEventCount, ...props } ) => {

  if (!Boolean(totalFeedEventCount)) {
    return null;
  }

  return <span className={className || ''} style={{lineHeight: 'normal'}}>{totalFeedEventCount} results</span>
}

export default connect(mapStateToProps, null)(memo(TotalReportCountString));
