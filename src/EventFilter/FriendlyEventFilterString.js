import React, { memo } from 'react';
import { connect } from 'react-redux';

import { calcFriendlyDurationString } from '../utils/datetime';
import { isFilterModified } from '../utils/event-filter-strings';

const mapStateToProps = ({ data: { eventFilter } }) => ({ eventFilter });



const FriendlyEventFilterString = (props) => {
  const { children, eventFilter, className } = props;

  const { state, filter: { date_range, priority, reported_by, text } } = eventFilter;

  const filterModified = isFilterModified(state, priority, text, reported_by);

  return <span style={{lineHeight: 'normal'}} className={className || ''}>Showing {filterModified && 'filtered'} reports updated from <strong>{calcFriendlyDurationString(date_range.lower, date_range.upper)}</strong>{children}</span>;
};

export default connect(mapStateToProps, null)(memo(FriendlyEventFilterString));