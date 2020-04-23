import React from 'react';
import { connect } from 'react-redux';

import { updateEventFilter } from '../ducks/event-filter';
import isNil from 'lodash/isNil';
import { dateIsValid } from '../utils/datetime';
import { trackEvent } from '../utils/analytics';

import DateRangeSelector from '../DateRangeSelector';

import styles from './styles.module.scss';


const EventFilterDateRangeSelector = (props) => {
  const { children, eventFilter, updateEventFilter, onStartChange, onEndChange, ...rest } = props;

  const { filter: { date_range } } = eventFilter;

  const { lower, upper } = date_range;

  const hasLower = !isNil(lower);
  const hasUpper = !isNil(upper);

  const onClickDateRangePreset = ({ lower, upper }, label) => {
    trackEvent('Event Filter', 'Select Date Range Preset', `Date Range: ${label}`);
    updateEventFilter({
      filter: {
        date_range: {
          lower,
          upper,
        },
      },
    });
  };

  const onEndDateChange = (val) => {
    const dateRangeUpdate = {
      ...eventFilter.filter.date_range,
      upper: dateIsValid(val) ? val.toISOString() : null,
    };
    updateEventFilter({
      filter: {
        date_range: dateRangeUpdate,
      },
    });
    trackEvent('Event Filter', 'Change End Date Filter');
    onEndChange && onEndChange(dateRangeUpdate);
  };


  const onStartDateChange = (val) => {
    const dateRangeUpdate = {
      ...eventFilter.filter.date_range,
      lower: dateIsValid(val) ? val.toISOString() : null,
    };
    updateEventFilter({
      filter: {
        date_range: dateRangeUpdate,
      },
    });
    trackEvent('Event Filter', 'Change Start Date Filter');
    onStartChange && onStartChange(dateRangeUpdate);
  };

  return <DateRangeSelector
    className={styles.dateSelect}
    endDate={hasUpper ? new Date(upper) : upper}
    endDateNullMessage='Now'
    onClickDateRangePreset={onClickDateRangePreset}
    onEndDateChange={onEndDateChange}
    onStartDateChange={onStartDateChange}
    showPresets={true}
    startDate={hasLower ? new Date(lower) : lower}
    startDateNullMessage='One month ago'
    {...rest}
  >
    {children}
  </DateRangeSelector>;
};

const mapStatetoProps = ({ data: { eventFilter } }) => ({ eventFilter });

export default connect(mapStatetoProps, { updateEventFilter })(EventFilterDateRangeSelector);