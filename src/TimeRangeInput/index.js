import React, { useState, useMemo, useCallback } from 'react';
import addMinutes from 'date-fns/add_minutes';
import { durationHumanizer, HUMANIZED_DURATION_CONFIGS } from '../utils/datetime';
import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';

import styles from './styles.module.scss';

const MINUTES_INTERVALS = 30;
const OPTIONS_TO_DISPLAY = 5;
const getHoursAndMinutesString = (date) => {
  return `${date.getHours()}:${date.getMinutes()}`;
};

const TimeRangeInput = ({ dateValue = null, showOptionsDurationFromInitialValue: showDuration = false, onTimeChange }) => {

  // const [temporalValue, settemporalValue] = useState(dateValue);

  const getTimeDuration = useMemo(() => {
    return durationHumanizer(HUMANIZED_DURATION_CONFIGS.ABBREVIATED_FORMAT);
  }, []);

  const generateTimeOptions = useCallback(() => {
    const options = [];
    let accumulatedMinutes = MINUTES_INTERVALS;

    while (options.length < OPTIONS_TO_DISPLAY) {
      const initialDate = dateValue ? new Date(dateValue) : new Date();
      const dateWithAccumulation = addMinutes(initialDate, accumulatedMinutes);
      const timeValue = getHoursAndMinutesString(dateWithAccumulation);

      options.push({
        value: timeValue,
        label: `${showDuration ? ` (${getTimeDuration(dateWithAccumulation - initialDate)})` : ''}`,
      });

      accumulatedMinutes += MINUTES_INTERVALS;
    }

    return options;
  }, [dateValue, getTimeDuration, showDuration]);

  return <div className={styles.inputWrapper}>
    <ClockIcon className={styles.icon}/>
    <input
      type="time"
      value={getHoursAndMinutesString(new Date(dateValue))}
      // onMouseMove={(e) => {e.target.focus();  settemporalValue(e.target.value);}}
      // onMouseDown={(e) => e.target.value = ''}
      // onMouseUp={(e) => e.target.value = temporalValue}
      list="timeOptions"
      className={styles.timeInput}
      onChange={(e) => onTimeChange(e.target.value)}
      />
    <datalist id="timeOptions">
      {generateTimeOptions().map((option) => {
        return <option value={option.value} label={option.label} key={option.value} />;
      })}
    </datalist>
  </div>;
};

export default TimeRangeInput;
