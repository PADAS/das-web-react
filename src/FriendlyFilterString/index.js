import React, { memo } from 'react';
import PropTypes from 'prop-types';
import isEqual from 'react-fast-compare';
import pluralize from 'pluralize';

import { calcFriendlyDurationString } from '../utils/datetime';
import { DEFAULT_EVENT_SORT, EVENT_SORT_OPTIONS, SORT_DIRECTION } from '../utils/event-filter';

const FriendlyFilterString = ({ children, className, dateRange, isFiltered, sortConfig, totalFeedCount }) => {
  const resultString = totalFeedCount ? `${totalFeedCount} ${pluralize('result', totalFeedCount)} ` : 'Results';

  const friendlyDurationString = calcFriendlyDurationString(dateRange.lower, dateRange.upper);

  const sortDirectionString = sortConfig?.[0] === SORT_DIRECTION.up ? ' ascending' : '';

  const hasSortConfig = !!sortConfig;
  const sortModified = hasSortConfig && !isEqual(sortConfig, DEFAULT_EVENT_SORT);
  const sortTypeMatch = hasSortConfig && EVENT_SORT_OPTIONS.find(option => option.value === sortConfig[1].value);
  const sortTypeName = hasSortConfig && sortTypeMatch.label.toLowerCase();

  return <p className={className || ''}>
    <span>{resultString}</span>
    {isFiltered && 'filtered'} from <strong>{friendlyDurationString}</strong>{children}
    {hasSortConfig && sortModified
      ? <span>, sorted {sortDirectionString}{sortTypeName ? <> by <strong>{sortTypeName}</strong></> : ''}</span>
      : ''}
  </p>;
};

FriendlyFilterString.propTypes = {
  children: null,
  className: null,
  isFiltered: false,
  sortConfig: null,
};

FriendlyFilterString.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  dateRange: PropTypes.shape({
    lower: PropTypes.string,
    upper: PropTypes.string,
  }).isRequired,
  isFiltered: PropTypes.bool,
  sortConfig: PropTypes.array,
  totalFeedCount: PropTypes.number.isRequired,
};

export default memo(FriendlyFilterString);
