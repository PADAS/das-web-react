import React, { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import isEqual from 'react-fast-compare';
import pluralize from 'pluralize';
import { useTranslation } from 'react-i18next';

import { calcFriendlyDurationString } from '../utils/datetime';
import { DEFAULT_EVENT_SORT, EVENT_SORT_OPTIONS, SORT_DIRECTION } from '../utils/event-filter';
import { DATE_LOCALES } from '../constants';

const FriendlyFilterString = ({ children, className, dateRange, isFiltered, sortConfig, totalFeedCount }) => {
  const { t, i18n: { language }  } = useTranslation('filters', { keyPrefix: 'friendlyDurationString' });

  const resultString = totalFeedCount
    ? `${totalFeedCount} ${pluralize(t('resultLabel'), totalFeedCount)} `
    : t('resultsLabel');

  const friendlyDurationString = calcFriendlyDurationString(dateRange.lower, dateRange.upper, t, DATE_LOCALES[language]);

  const sortDirectionString = sortConfig?.[0] === SORT_DIRECTION.up ? t('ascendingLabel') : '';

  const hasSortConfig = !!sortConfig;
  const sortModified = hasSortConfig && !isEqual(sortConfig, DEFAULT_EVENT_SORT);
  const sortTypeMatch = hasSortConfig && EVENT_SORT_OPTIONS.find(option => option.value === sortConfig[1].value);
  const sortTypeName = hasSortConfig && t(`eventSortOptions.${sortTypeMatch.key}`).toLowerCase();

  const sortingByLabel = useMemo(() => {
    if (!sortTypeName){
      return '';
    }
    return <>
      <span>{t('byLabel')}</span>
      <strong>{sortTypeName}</strong>
    </>;
  }, [sortTypeName, t]);

  const sortingTypeLabel = useMemo(() => {
    if (!hasSortConfig || !sortModified){
      return '';
    }
    return <span>
      {t('sortingTypeLabel', { sortDirectionString })}
      {sortingByLabel}
    </span>;
  }, [hasSortConfig, sortDirectionString, sortModified, sortingByLabel, t]);

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
