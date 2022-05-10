import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import addMinutes from 'date-fns/add_minutes';
import { durationHumanizer, HUMANIZED_DURATION_CONFIGS } from '../utils/datetime';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';

import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';
import { ReactComponent as ArrowDown } from '../common/images/icons/arrow-down-small.svg';
import { ReactComponent as ArrowUp } from '../common/images/icons/arrow-up-small.svg';

import styles from './styles.module.scss';

const MINUTES_INTERVALS = 30;
const OPTIONS_TO_DISPLAY = 5;

const getHoursAndMinutesString = (date) => {
  const dateMinutes = (date.getMinutes()<10?'0':'') + date.getMinutes();
  const dateHours = (date.getHours()<10?'0':'') + date.getHours();
  return `${dateHours}:${dateMinutes}`;
};

const TimeRangeInput = ({ dateValue = null, starDateRange = new Date(), showOptionsDurationFromInitialValue: showDuration = false, onTimeChange }) => {
  const targetRef = useRef(null);
  const [isPopoverOpen, setPopoverState] = useState(false);
  const [initialDate, setInitialDate] = useState(starDateRange);

  useEffect(() => {
    if (!!dateValue) {
      setInitialDate(new Date(dateValue));
    }
  }, [dateValue]);

  const getTimeDuration = useMemo(() => {
    return durationHumanizer(HUMANIZED_DURATION_CONFIGS.ABBREVIATED_FORMAT);
  }, []);

  const generateTimeOptions = useCallback(() => {
    const options = [];
    let accumulatedMinutes = MINUTES_INTERVALS;

    while (options.length < OPTIONS_TO_DISPLAY) {
      const dateWithAccumulation = addMinutes(initialDate, accumulatedMinutes);
      const timeValue = getHoursAndMinutesString(dateWithAccumulation);

      options.push({
        value: timeValue,
        duration: showDuration ? ` (${getTimeDuration(dateWithAccumulation - initialDate)})` : '',
      });

      accumulatedMinutes += MINUTES_INTERVALS;
    }

    return options;
  }, [getTimeDuration, initialDate, showDuration]);

  const handleTimeChange = useCallback((time) => {
    const timeParts = time.split(':');
    const timestampWithSelectedTime = new Date(initialDate).setHours(timeParts[0], timeParts[1], '00');
    onTimeChange(new Date(timestampWithSelectedTime));
  }, [initialDate, onTimeChange]);

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
          min="00:00"
          data-testid="time-input"
          ref={targetRef}
          value={dateValue ? getHoursAndMinutesString(new Date(dateValue)) : ''}
          onFocus={() => setPopoverState(true)}
          onBlur={() => setPopoverState(false)}
          className={styles.timeInput}
          onChange={(e) => handleTimeChange(e.target.value)}
          />
      </OverlayTrigger>
      {isPopoverOpen ? <ArrowUp/> : <ArrowDown/>}
    </div>
  </>;
};

export default TimeRangeInput;
