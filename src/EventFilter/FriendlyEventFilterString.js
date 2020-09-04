import React, { memo } from 'react';
import { connect } from 'react-redux';

import { calcFriendlyDurationString } from '../utils/datetime';
import { isFilterModified } from '../utils/event-filter';

const mapStateToProps = ({ data: { eventFilter } }) => ({ eventFilter });



const FriendlyEventFilterString = (props) => {
  const { children, eventFilter, className } = props;

  const { filter: { date_range } } = eventFilter;

  const filterModified = isFilterModified(eventFilter);

  return <span style={{lineHeight: 'normal'}} className={className || ''}>Showing {filterModified && 'filtered'} reports updated from <strong>{calcFriendlyDurationString(date_range.lower, date_range.upper)}</strong>{children}</span>;
};

export default connect(mapStateToProps, null)(memo(FriendlyEventFilterString));