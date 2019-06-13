import React, { memo, useState } from 'react';
import { Button } from 'react-bootstrap';
import PropTypes from 'prop-types';

import DateTimePicker from 'react-datetime-picker';

import styles from './styles.module.scss';
import { generateMonthsAgoDate, generateDaysAgoDate, generateWeeksAgoDate } from '../utils/datetime';

import { DATEPICKER_DEFAULT_CONFIG } from '../constants';

const DateRangeSelector = (props) => {
  const { startDate, endDate, onStartDateChange, onEndDateChange, onDateRangeChange, startDateLabel, endDateLabel, maxDate, requireStart, requireEnd, showPresets, startDateNullMessage, endDateNullMessage, className, ...rest } = props;

  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const onStartOpen = () => setStartOpen(true);
  const onStartClose = () => setStartOpen(false);

  const onEndOpen = () => setEndOpen(true);
  const onEndClose = () => setEndOpen(false);

  const showStartNullMessage = !requireStart && !startOpen && !startDate && !!startDateNullMessage;
  const showEndNullMessage = !requireEnd && !endOpen && !endDate && !!endDateNullMessage;

  return <div className={className || ''}>
    <label className={styles.label}>
      <span>{startDateLabel}</span>
      <span className={styles.wrapper}>
        {showStartNullMessage && !endDate && <span className={styles.nullMessage}>{startDateNullMessage}</span>}
        <DateTimePicker {...DATEPICKER_DEFAULT_CONFIG} {...rest} isCalendarOpen={startOpen} clearIcon={null} onClockOpen={onStartOpen} onCloseClose={onStartClose} onCalendarOpen={onStartOpen} onCalendarClose={onStartClose} required={requireStart} maxDate={endDate ? endDate : maxDate} value={startDate} onChange={onStartDateChange} />
      </span>
    </label>
    <label className={styles.label}>
      <span>{endDateLabel}</span>
      <span className={styles.wrapper}>
        {showEndNullMessage && <span className={styles.nullMessage}>{endDateNullMessage}</span>}
        <DateTimePicker {...DATEPICKER_DEFAULT_CONFIG} {...rest} isCalendarOpen={endOpen} clearIcon={null} onClockOpen={onEndOpen} onCloseClose={onEndClose} onCalendarOpen={onEndOpen} onCalendarClose={onEndClose} required={requireEnd} minDate={startDate} maxDate={maxDate} value={endDate} onChange={onEndDateChange} />
      </span>
    </label>

    {showPresets && <div className={styles.presets}>
      <Button variant='info' onClick={() => onDateRangeChange({
        lower: generateMonthsAgoDate(3),
        upper: null,
      })}>Last three months</Button>

      <Button variant='info' onClick={() => onDateRangeChange({
        lower: generateDaysAgoDate(30),
        upper: null,
      })}>Last 30 days</Button>

      <Button variant='info' onClick={() => onDateRangeChange({
        lower: generateWeeksAgoDate(1),
        upper: null,
      })}>Last week</Button>

      <Button variant='info' onClick={() => onDateRangeChange({
        lower: generateDaysAgoDate(1),
        upper: null,
      })}>Yesterday</Button>

      <Button variant='info' onClick={() => onDateRangeChange({
        lower: generateDaysAgoDate(0),
        upper: null,
      })}>Today</Button>

    </div>}
  </div>;
};

DateRangeSelector.defaultProps = {
  endDateLabel: 'To:',
  maxDate: new Date(),
  requireStart: false,
  requireEnd: false,
  startDateLabel: 'From:',
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