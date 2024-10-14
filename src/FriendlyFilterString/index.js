import React, { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import isEqual from 'react-fast-compare';
import pluralize from 'pluralize';
import { useTranslation } from 'react-i18next';

import { calcFriendlyDurationString } from '../utils/datetime';
import { SORT_DIRECTION, DEFAULT_EVENT_SORT, EVENT_SORT_OPTIONS } from '../ducks/event-filter';

const FriendlyFilterString = ({ children, className, dateRange, isFiltered, sortConfig, totalFeedCount }) => {
  const { t } = useTranslation('filters', { keyPrefix: 'friendlyFilterString' });

  const resultString = totalFeedCount
    ? `${totalFeedCount} ${pluralize(t('resultLabel'), totalFeedCount)} `
    : t('resultsLabel');

  const friendlyDurationString = calcFriendlyDurationString(dateRange.lower, dateRange.upper);

  const sortDirectionString = sortConfig?.[0] === SORT_DIRECTION.up ? t('ascendingLabel') : '';

  const hasSortConfig = !!sortConfig;
  const sortModified = hasSortConfig && !isEqual(sortConfig, DEFAULT_EVENT_SORT);
  const sortTypeMatch = hasSortConfig && EVENT_SORT_OPTIONS.find((option) => option.value === sortConfig[1].value);
  const sortTypeName = hasSortConfig && t(`eventSortOptions.${sortTypeMatch.key}`).toLowerCase();

  const sortingTypeLabel = useMemo(() => {
    if (!hasSortConfig || !sortModified){
      return '';
    }
    return <span>
      {t('sortingTypeLabel', { sortDirection: sortDirectionString })}
      { !sortTypeName ? '' : (
        <>
          <span>{t('byLabel')}</span>
          <strong>{sortTypeName}</strong>
        </>
      )}
    </span>;
  }, [hasSortConfig, sortDirectionString, sortModified, sortTypeName, t]);

  return <p className={className || ''}>
    <span>{resultString}</span>
    {isFiltered && t('filteredLabel')}
    {t('fromLabel')}
    <strong>{friendlyDurationString}</strong>
    {children}
    {sortingTypeLabel}
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
  totalFeedCount: PropTypes.number,
};

export default memo(FriendlyFilterString);
