import React from 'react';
import { connect } from 'react-redux';

import { updateEventFilter } from '../ducks/event-filter';
import isNil from 'lodash/isNil';
import { dateIsValid, calcFriendlyDurationString } from '../utils/datetime';
import { trackEvent } from '../utils/analytics';

import DateRangeSelector from '../DateRangeSelector';

import styles from './styles.module.scss';


const EventFilterDateRangeSelector = (props) => {
  const { children, eventFilter, updateEventFilter, ...rest } = props;

  const { filter: { date_range } } = eventFilter;

  const { lower, upper } = date_range;

  const hasLower = !isNil(lower);
  const hasUpper = !isNil(upper);

  const onDateRangeChange = ({ lower, upper }) => {
    updateEventFilter({
      filter: {
        date_range: {
          lower,
          upper,
        },
      },
    });
    trackEvent('Feed', 'Click Reset All Filters');
  };

  const onEndDateChange = (val) => {
    updateEventFilter({
      filter: {
        date_range: {
          ...eventFilter.filter.date_range,
          upper: dateIsValid(val) ? val.toISOString() : null,
        },
      },
    });
    trackEvent('Feed', 'Change Filter End Date Filter');
  };


  const onStartDateChange = (val) => {
    updateEventFilter({
      filter: {
        date_range: {
          ...eventFilter.filter.date_range,
          lower: dateIsValid(val) ? val.toISOString() : null,
        },
      },
    });
    trackEvent('Feed', 'Change Start Date Filter');
  };

  return <DateRangeSelector
  className={styles.dateSelect}
  endDate={hasUpper ? new Date(upper) : upper}
  endDateNullMessage='Now'
  onDateRangeChange={onDateRangeChange}
  onEndDateChange={onEndDateChange}
  onStartDateChange={onStartDateChange}
  showPresets={true}
  startDate={hasLower ? new Date(lower) : lower}
  startDateNullMessage='One month ago'
  gaEventSrc='Event Filter'
  {...rest}
  >
    {children}
  </DateRangeSelector>
};

const mapStatetoProps = ({ data: { eventFilter } }) => ({ eventFilter });

export default connect(mapStatetoProps, { updateEventFilter })(EventFilterDateRangeSelector);