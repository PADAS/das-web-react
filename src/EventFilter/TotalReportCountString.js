import React, { memo } from 'react';
import { connect } from 'react-redux';


const mapStateToProps = ({ data: { eventFilter } }) => ({ eventFilter });

const TotalReportCountString = ({ className, eventFilter, totalFeedEventCount, ...props } ) => {

  if (!totalFeedEventCount) {
    return null;
  }

  const resultString = `${totalFeedEventCount} result${totalFeedEventCount === 1 ? '' : 's'}`;

  return <span className={className || ''} style={{lineHeight: 'normal'}}>{resultString}</span>;
};

export default connect(mapStateToProps, null)(memo(TotalReportCountString));
