import React, { memo, useMemo, useCallback } from 'react';
import isNil from 'lodash/isNil';
import { dateIsValid } from '../utils/datetime';
import distanceInWordsToNow from 'date-fns/distance_in_words_to_now';

import DateRangeSelector from '../DateRangeSelector';

import styles from './styles.module.scss';


const FeedDateFilter = (props) => {
  const { children, filterData, updateFilter, afterClickPreset, afterStartChange, afterEndChange, popoverClassName, ...rest } = props;

  const { filter: { date_range } } = filterData;

  const { lower, upper } = date_range;

  const hasLower = !isNil(lower);
  const hasUpper = !isNil(upper);

  const onClickDateRangePreset = useCallback(({ lower, upper }, label) => {
    updateFilter({
      filter: {
        date_range: {
          lower,
          upper,
        },
      },
    });
    afterClickPreset && afterClickPreset(label);
  }, [afterClickPreset, updateFilter]);

  const onEndDateChange = useCallback((val) => {
    const dateRangeUpdate = {
      ...filterData.filter.date_range,
      upper: dateIsValid(val) ? val.toISOString() : null,
    };
    updateFilter({
      filter: {
        date_range: dateRangeUpdate,
      },
    });
    afterEndChange && afterEndChange(dateRangeUpdate);
  }, [filterData.filter.date_range, afterEndChange, updateFilter]);


  const onStartDateChange = useCallback((val) => {
    const dateRangeUpdate = {
      ...filterData.filter.date_range,
      lower: dateIsValid(val) ? val.toISOString() : null,
    };
    updateFilter({
      filter: {
        date_range: dateRangeUpdate,
      },
    });
    afterStartChange && afterStartChange(dateRangeUpdate);
  }, [filterData.filter.date_range, afterStartChange, updateFilter]);

  const startDateNullMessage = useMemo(() => hasLower ? `${distanceInWordsToNow(new Date(lower))} ago` : null, [hasLower, lower]);
  const endDateNullMessage = 'Now';

  return <DateRangeSelector
    className={styles.dateSelect}
    popoverClassName={popoverClassName || ''}
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
