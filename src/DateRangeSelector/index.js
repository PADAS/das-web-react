import React, { memo, useState } from 'react';
import uuid from 'uuid';
import { Button } from 'react-bootstrap';
import PropTypes from 'prop-types';

import DateTimePicker from 'react-datetime-picker';

import styles from './styles.module.scss';

const DATEPICKER_CONFIG = {
  disableClock: true,
  format: 'dd-MM-yyyy',
};

const DateRangeSelector = (props) => {
  const { startDate, endDate, onStartDateChange, onEndDateChange, startDateLabel, endDateLabel, maxDate, requireStart, requireEnd, startDateNullMessage, endDateNullMessage, className, ...rest } = props;

  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const onStartOpen = () => setStartOpen(true);
  const onStartClose = () => setStartOpen(false);

  const onEndOpen = () => setEndOpen(true);
  const onEndClose = () => setEndOpen(false);

  const clearStartDate = () => onStartDateChange(null);
  const clearEndDate = () => onEndDateChange(null);

  const showStartNullMessage = !requireStart && !startOpen && !startDate && !!startDateNullMessage;
  const showEndNullMessage = !requireEnd && !endOpen && !endDate && !!endDateNullMessage;

  const showStartClear = !requireStart && !!startDate;
  const showEndClear = !requireEnd && !!endDate;

  return <div className={className || ''}>
    <label className={styles.label}>
      <span>{startDateLabel}</span>
      <span className={styles.wrapper}>
        {showStartNullMessage && <span className={styles.nullMessage}>{startDateNullMessage}</span>}
        {showStartClear && <Button onClick={clearStartDate}>Clear</Button>}
        <DateTimePicker {...DATEPICKER_CONFIG} {...rest} isCalendarOpen={startOpen} clearIcon={null} onClockOpen={onStartOpen} onCloseClose={onStartClose} onCalendarOpen={onStartOpen} onCalendarClose={onStartClose} required={requireStart} maxDate={maxDate} value={startDate} onChange={onStartDateChange} />
      </span>
    </label>
    <label className={styles.label}>
      <span>{endDateLabel}</span>
      <span className={styles.wrapper}>
        {showEndNullMessage && <span className={styles.nullMessage}>{endDateNullMessage}</span>}
        {showEndClear && <Button onClick={clearEndDate}>Clear</Button>}
        <DateTimePicker {...DATEPICKER_CONFIG} {...rest} isCalendarOpen={endOpen} clearIcon={null} onClockOpen={onEndOpen} onCloseClose={onEndClose} onCalendarOpen={onEndOpen} onCalendarClose={onEndClose} required={requireEnd} minDate={startDate} maxDate={maxDate} value={endDate} onChange={onEndDateChange} />
      </span>
    </label>
  </div>;
};

DateRangeSelector.defaultProps = {
  endDateLabel: 'To:',
  maxDate: new Date(),
  requireStart: false,
  requireEnd: false,
  startDateLabel: 'From:',
};

DateRangeSelector.propTypes = {
  endDate: PropTypes.instanceOf(Date),
  endDateLabel: PropTypes.string,
  endDateNullMessage: PropTypes.string,
  maxDate: PropTypes.instanceOf(Date),
  onEndDateChange: PropTypes.func.isRequired,
  onStartDateChange: PropTypes.func.isRequired,
  requireStart: PropTypes.bool,
  requireEnd: PropTypes.bool,
  startDate: PropTypes.instanceOf(Date),
  startDateLabel: PropTypes.string,
  startDateNullMessage: PropTypes.string,
};

export default memo(DateRangeSelector);