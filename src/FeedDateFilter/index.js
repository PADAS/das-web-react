import React, { memo, useMemo, useCallback } from 'react';
import isNil from 'lodash/isNil';
import isEqual from 'react-fast-compare';
import { dateIsValid } from '../utils/datetime';
import distanceInWordsToNow from 'date-fns/distance_in_words_to_now';

import DateRangeSelector from '../DateRangeSelector';

import styles from './styles.module.scss';


const FeedDateFilter = (props) => {
  const { children, defaultRange, nullUpperOverride = null, dateRange, updateFilter, afterClickPreset, afterStartChange, afterEndChange, popoverClassName, ...rest } = props;


  const { lower, upper } = dateRange;

  const hasLower = !isNil(lower);
  const hasUpper = !isNil(upper);

  const isAtDefault = useMemo(() => !!defaultRange && isEqual(defaultRange, dateRange), [defaultRange, dateRange]);

  const onClickDateRangePreset = useCallback(({ lower, upper }, label) => {
    const dateRangeUpdate = {
      lower,
      upper: upper === null ? nullUpperOverride : upper,
    };
    
    updateFilter(dateRangeUpdate);
    afterClickPreset && afterClickPreset(label);
  }, [afterClickPreset, nullUpperOverride, updateFilter]);

  const onEndDateChange = useCallback((val) => {
    const dateRangeUpdate = {
      ...dateRange,
      upper: dateIsValid(val)
        ? val.toISOString()
        : val === null 
          ? nullUpperOverride 
          : val,
    };
    updateFilter(dateRangeUpdate);
    afterEndChange && afterEndChange(dateRangeUpdate);
  }, [dateRange, nullUpperOverride, updateFilter, afterEndChange]);


  const onStartDateChange = useCallback((val) => {
    const dateRangeUpdate = {
      ...dateRange,
      lower: dateIsValid(val) ? val.toISOString() : null,
    };
    updateFilter(dateRangeUpdate);
    afterStartChange && afterStartChange(dateRangeUpdate);
  }, [afterStartChange, dateRange, updateFilter]);

  const startDateNullMessage = useMemo(() => hasLower ? `${distanceInWordsToNow(new Date(lower))} ago` : null, [hasLower, lower]);
  const endDateNullMessage = 'Now';

  return <DateRangeSelector
    className={styles.dateSelect}
    popoverClassName={popoverClassName || ''}
    isAtDefault={isAtDefault}
    placement={props.placement || 'auto'}
    endDate={hasUpper ? new Date(upper) : upper}
    endDateNullMessage={endDateNullMessage}
    onClickDateRangePreset={onClickDateRangePreset}
    onEndDateChange={onEndDateChange}
    onStartDateChange={onStartDateChange}
    showPresets={true}
    startDate={hasLower ? new Date(lower) : lower}
    startDateNullMessage={startDateNullMessage}
    {...rest} >
    {children}
  </DateRangeSelector>;
};

export default memo(FeedDateFilter);
