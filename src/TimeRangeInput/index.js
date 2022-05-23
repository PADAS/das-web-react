import React, { useState, useCallback, useRef } from 'react';
import addMinutes from 'date-fns/add_minutes';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';

import { getHoursAndMinutesString, durationHumanizer, HUMANIZED_DURATION_CONFIGS } from '../utils/datetime';

import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';

import styles from './styles.module.scss';

const MINUTES_INTERVALS = 30;
const OPTIONS_TO_DISPLAY = 5;

const timeConfig = HUMANIZED_DURATION_CONFIGS.ABBREVIATED_FORMAT;
timeConfig.units = ['h', 'm'];
const getHumanizedTimeDuration =  durationHumanizer(timeConfig);

const TimeRangeInput = ({
  timeValue = null,
  dateValue = null,
  starDateRange,
  showOptionsDurationFromInitialValue: showDuration = false,
  onTimeChange
}) => {
  const targetRef = useRef(null);

  const [isPopoverOpen, setPopoverState] = useState(false);

  const generateTimeOptions = useCallback(() => {
    const options = [];
    const initialDate = starDateRange || dateValue || new Date();
    let accumulatedMinutes = MINUTES_INTERVALS;

    while (options.length < OPTIONS_TO_DISPLAY) {
      const dateWithAccumulation = addMinutes(initialDate, accumulatedMinutes);
      const timeValue = getHoursAndMinutesString(dateWithAccumulation);

      options.push({
        value: timeValue,
        duration: showDuration ? ` (${getHumanizedTimeDuration(dateWithAccumulation - initialDate)})` : '',
      });

      accumulatedMinutes += MINUTES_INTERVALS;
    }

    return options;
  }, [dateValue, showDuration, starDateRange]);

  const handleTimeChange = useCallback((time) => {
    const timeParts = time.split(':');
    const DateToChange = dateValue ? new Date(dateValue) : new Date();
    onTimeChange(new Date(DateToChange.setHours(timeParts[0], timeParts[1], '00')));
  }, [dateValue, onTimeChange]);

  return <>
    <div className={styles.inputWrapper} >
      <ClockIcon/>
      <OverlayTrigger target={targetRef.current} trigger='focus' placement="bottom" overlay={<Popover className={styles.popoverOptions}>
        <ul>
          {generateTimeOptions().map((option) => {
          return <li onClick={() => handleTimeChange(option.value)} key={option.value} className={styles.timeOption}>
            <span>{option.value}</span>
            <span>{option.duration}</span>
          </li>;
        })}
        </ul>
      </Popover>}>
        <input
          type="time"
          min={starDateRange ? getHoursAndMinutesString(starDateRange) : '00:00'}
          data-testid="time-input"
          ref={targetRef}
          value={timeValue || ''}
          onFocus={() => setPopoverState(true)}
          onBlur={() => setPopoverState(false)}
          className={styles.timeInput}
          onChange={(e) => handleTimeChange(e.target.value)}
          />
      </OverlayTrigger>
      <div data-testid="time-input-triangle-arrow" className={`${styles.triangle} ${isPopoverOpen? 'open' : ''}`}></div>
    </div>
  </>;
};

export default TimeRangeInput;
