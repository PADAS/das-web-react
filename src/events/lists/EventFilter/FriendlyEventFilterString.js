import React, { memo } from 'react';
import isEqual from 'react-fast-compare';
import { connect } from 'react-redux';
import pluralize from 'pluralize';

import { calcFriendlyDurationString } from '../../../utils/datetime';
import { DEFAULT_EVENT_SORT, EVENT_SORT_OPTIONS, SORT_DIRECTION } from '../../../utils/event-filter';
import { isFilterModified } from '../../../utils/event-filter';

const mapStateToProps = ({ data: { eventFilter } }) => ({ eventFilter });

const FriendlyEventFilterString = (props) => {
  const { children, eventFilter, totalFeedEventCount, sortConfig, className } = props;

  const { filter: { date_range } } = eventFilter;
  let resultString;

  if (totalFeedEventCount) {
    resultString = `${totalFeedEventCount} ${pluralize('result', totalFeedEventCount)} `;
  } else {
    resultString = 'Results';
  }

  const filterModified = isFilterModified(eventFilter);
  const hasSortConfig = !!sortConfig;
  const sortModified = hasSortConfig && !isEqual(sortConfig, DEFAULT_EVENT_SORT);
  const sortTypeMatch = hasSortConfig && EVENT_SORT_OPTIONS.find(option => option.value === sortConfig[1].value);


  const sortTypeName = hasSortConfig && sortTypeMatch.label.toLowerCase();

  return <p className={className || ''}>
    <span>{resultString}</span>
    {filterModified && 'filtered'} from <strong>{calcFriendlyDurationString(date_range.lower, date_range.upper)}</strong>{children}
    {hasSortConfig && sortModified
      ?<span>, sorted {sortConfig[0] === SORT_DIRECTION.up ? ' ascending' : ''}{sortTypeName ? <> by <strong>{sortTypeName}</strong></> : ''}</span>
      : ''}
  </p>;
};

export default connect(mapStateToProps, null)(memo(FriendlyEventFilterString));