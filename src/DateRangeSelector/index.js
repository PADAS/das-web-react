import React, { memo, useRef } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';
import endOfDay from 'date-fns/end_of_day';

import DateTimePicker from 'react-datetime-picker';

import styles from './styles.module.scss';
import { generateMonthsAgoDate, generateDaysAgoDate, generateWeeksAgoDate } from '../utils/datetime';

import DateRangeSelectionString from './DateRangeSelectionString';

import { DATEPICKER_DEFAULT_CONFIG } from '../constants';

const DateRangeSelector = (props) => {
  const { startDate, endDate, onStartDateChange, onEndDateChange, onClickDateRangePreset,
    startDateLabel, endDateLabel, maxDate, requireStart, requireEnd, showPresets,
    startDateNullMessage, onStartDateBlur, onEndDateBlur, endDateNullMessage, className, gaEventSrc, 
    children, ...rest } = props;

  const showStartNullMessage = !requireStart && !startDate && !!startDateNullMessage;
  const showEndNullMessage = !requireEnd && !endDate && !!endDateNullMessage;

  const endDateDayClicked = useRef(false);

  const handleEndDateChange = (val) => {
    if (endDateDayClicked.current) {
      endDateDayClicked.current = false;
      return onEndDateChange(endOfDay(val));
    }
    return onEndDateChange(val);
  };

  const handleEndDateDayClick = () => {
    endDateDayClicked.current = true;
  };

  return <div className={className || ''}>
    <div  className={styles.currentSelectedRange}><DateRangeSelectionString className={styles.rangeString} startDate={startDate} endDate={endDate} /></div>
    <div className={styles.dateSelectorWrapper}>
      <label className={styles.label}>
        {startDateLabel && <span>{startDateLabel}</span>}
        <span>
          {showStartNullMessage && !endDate && <span className={styles.nullMessage}>{startDateNullMessage}</span>}
          <DateTimePicker {...DATEPICKER_DEFAULT_CONFIG} {...rest} required={requireStart} maxDate={endDate ? endDate : maxDate} value={startDate} onChange={onStartDateChange} onBlur={onStartDateBlur} />
        </span>
      </label>
      <span className={styles.dateRangeArrow}>⇨</span>
      {children}
      <label className={styles.label}>
        {endDateLabel && <span>{endDateLabel}</span>}
        <span>
          {showEndNullMessage && <span className={styles.nullMessage}>{endDateNullMessage}</span>}
          <DateTimePicker onClickDay={handleEndDateDayClick} {...DATEPICKER_DEFAULT_CONFIG} {...rest} required={requireEnd} minDate={startDate} maxDate={maxDate} value={endDate} onChange={handleEndDateChange} onBlur={onEndDateBlur} />
        </span>
      </label>
    </div>

    {showPresets && <div className={styles.presets}>
      <Button variant='link' onClick={() => onClickDateRangePreset({
        lower: generateDaysAgoDate(0),
        upper: null,
      }, 'today')}>Today</Button>

      <Button variant='link' onClick={() => onClickDateRangePreset({
        lower: generateDaysAgoDate(1),
        upper: null,
      }, 'yesterday')}>Yesterday</Button>

      <Button variant='link' onClick={() => onClickDateRangePreset({
        lower: generateWeeksAgoDate(1),
        upper: null,
      }, 'last week')}>Last week</Button>

      <Button variant='link' onClick={() => onClickDateRangePreset({
        lower: generateDaysAgoDate(30),
        upper: null,
      }, 'last 30 days')}>Last 30 days</Button>

      <Button variant='link' onClick={() => onClickDateRangePreset({
        lower: generateMonthsAgoDate(3),
        upper: null,
      }, 'last three months')}>Last three months</Button>
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
  onClickDateRangePreset: ({ lower, upper }) => null,
  showPresets: false,
};

DateRangeSelector.propTypes = {
  endDate: PropTypes.instanceOf(Date),
  endDateLabel: PropTypes.string,
  endDateNullMessage: PropTypes.string,
  maxDate: PropTypes.instanceOf(Date),
  onEndDateChange: PropTypes.func.isRequired,
  onStartDateChange: PropTypes.func.isRequired,
  onClickDateRangePreset: PropTypes.func,
  requireStart: PropTypes.bool,
  requireEnd: PropTypes.bool,
  showPresets: PropTypes.bool,
  startDate: PropTypes.instanceOf(Date),
  startDateLabel: PropTypes.string,
  startDateNullMessage: PropTypes.string,
};

export default memo(DateRangeSelector);
