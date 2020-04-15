import React, { memo } from 'react';
import { connect } from 'react-redux';

import { calcFriendlyDurationString } from '../utils/datetime';

import { INITIAL_FILTER_STATE } from '../ducks/event-filter';

import isEqual from 'react-fast-compare';

const mapStateToProps = ({ data: { eventFilter } }) => ({ eventFilter });



const FriendlyEventFilterString = (props) => {
  const { children, eventFilter, className } = props;

  const { state, filter: { date_range, priority, reported_by, text } } = eventFilter;

  const filterModified = !isEqual(INITIAL_FILTER_STATE.state, state)
    || !isEqual(INITIAL_FILTER_STATE.filter.priority, priority)
    || !isEqual(INITIAL_FILTER_STATE.filter.text, text)
    || !isEqual(INITIAL_FILTER_STATE.filter.reported_by, reported_by);

  return <span style={{lineHeight: 'normal'}} className={className || ''}>Showing {filterModified && 'filtered'} reports and locations from <strong>{calcFriendlyDurationString(date_range.lower, date_range.upper)}</strong>{children}</span>;
};

export default connect(mapStateToProps, null)(memo(FriendlyEventFilterString));