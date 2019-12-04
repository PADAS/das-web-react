import React, { memo } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

import DateTimePicker from 'react-datetime-picker';

import styles from './styles.module.scss';
import { generateMonthsAgoDate, generateDaysAgoDate, generateWeeksAgoDate } from '../utils/datetime';
import { trackEvent } from '../utils/analytics';

import { DATEPICKER_DEFAULT_CONFIG } from '../constants';

const DateRangeSelector = (props) => {
  const { startDate, endDate, onStartDateChange, onEndDateChange, onDateRangeChange,
    startDateLabel, endDateLabel, maxDate, requireStart, requireEnd, showPresets,
    startDateNullMessage, endDateNullMessage, className, gaEventSrc, children, ...rest } = props;

  const handleStartDateChange = (val) => {
    trackEvent(gaEventSrc, 'Enter Start Date', null);
    onStartDateChange(val);
  };

  const handleEndDateChange = (val) => {
    trackEvent(gaEventSrc, 'Enter End Date', null);
    onEndDateChange(val);
  };

  const showStartNullMessage = !requireStart && !startDate && !!startDateNullMessage;
  const showEndNullMessage = !requireEnd && !endDate && !!endDateNullMessage;

  return <div className={className || ''}>
    <div className={styles.dateSelectorWrapper}>
      <label className={styles.label}>
        {startDateLabel && <span>{startDateLabel}</span>}
        <span>
          {showStartNullMessage && !endDate && <span className={styles.nullMessage}>{startDateNullMessage}</span>}
          <DateTimePicker {...DATEPICKER_DEFAULT_CONFIG} {...rest} required={requireStart} maxDate={endDate ? endDate : maxDate} value={startDate} onChange={handleStartDateChange} />
        </span>
      </label>
      <span className={styles.dateRangeArrow}>⇨</span>
      {children}
      <label className={styles.label}>
        {endDateLabel && <span>{endDateLabel}</span>}
        <span>
          {showEndNullMessage && <span className={styles.nullMessage}>{endDateNullMessage}</span>}
          <DateTimePicker {...DATEPICKER_DEFAULT_CONFIG} {...rest} required={requireEnd} minDate={startDate} maxDate={maxDate} value={endDate} onChange={handleEndDateChange} />
        </span>
      </label>
    </div>

    {showPresets && <div className={styles.presets}>
      <Button variant='info' onClick={() => onDateRangeChange({
        lower: generateDaysAgoDate(0),
        upper: null,
      })}>Today</Button>

      <Button variant='info' onClick={() => onDateRangeChange({
        lower: generateDaysAgoDate(1),
        upper: null,
      })}>Yesterday</Button>

      <Button variant='info' onClick={() => onDateRangeChange({
        lower: generateWeeksAgoDate(1),
        upper: null,
      })}>Last week</Button>

      <Button variant='info' onClick={() => onDateRangeChange({
        lower: generateDaysAgoDate(30),
        upper: null,
      })}>Last 30 days</Button>

      <Button variant='info' onClick={() => onDateRangeChange({
        lower: generateMonthsAgoDate(3),
        upper: null,
      })}>Last three months</Button>
    </div>}
  </div>;
};

DateRangeSelector.defaultProps = {
  endDateLabel: 'To:',
  maxDate: new Date(),
  requireStart: false,
  requireEnd: false,
  startDateLabel: 'From:',
  format: 'yyyy-MM-dd HH:mm',
  onDateRangeChange: ({ lower, upper }) => null,
  showPresets: false,
};

DateRangeSelector.propTypes = {
  endDate: PropTypes.instanceOf(Date),
  endDateLabel: PropTypes.string,
  endDateNullMessage: PropTypes.string,
  maxDate: PropTypes.instanceOf(Date),
  onEndDateChange: PropTypes.func.isRequired,
  onStartDateChange: PropTypes.func.isRequired,
  onDateRangeChange: PropTypes.func,
  requireStart: PropTypes.bool,
  requireEnd: PropTypes.bool,
  showPresets: PropTypes.bool,
  startDate: PropTypes.instanceOf(Date),
  startDateLabel: PropTypes.string,
  startDateNullMessage: PropTypes.string,
};

export default memo(DateRangeSelector);
