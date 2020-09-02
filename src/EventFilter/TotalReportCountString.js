import React, { memo } from 'react';
import { connect } from 'react-redux';

import { INITIAL_FILTER_STATE } from '../ducks/event-filter';

import isEqual from 'react-fast-compare';


const mapStateToProps = ({ data: { eventFilter } }) => ({ eventFilter });

const TotalReportCountString = ({ className, eventFilter, totalFeedEventCount, ...props } ) => {
  const { state, filter: { date_range, priority, reported_by, text } } = eventFilter;

  const filterModified = !isEqual(INITIAL_FILTER_STATE.state, state)
    || !isEqual(INITIAL_FILTER_STATE.filter.priority, priority)
    || !isEqual(INITIAL_FILTER_STATE.filter.text, text)
    || !isEqual(INITIAL_FILTER_STATE.filter.reported_by, reported_by);

  if (!filterModified || !Boolean(totalFeedEventCount)) {
    return null;
  }

  return <span className={className || ''} style={{lineHeight: 'normal'}}>{totalFeedEventCount} results</span>
}

export default connect(mapStateToProps, null)(memo(TotalReportCountString));
