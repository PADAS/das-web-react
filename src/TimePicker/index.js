import React, { memo, useCallback, useMemo, useState } from 'react';
import addMinutes from 'date-fns/add_minutes';
import differenceInMilliseconds from 'date-fns/difference_in_milliseconds';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';

import { getHoursAndMinutesString, durationHumanizer, HUMANIZED_DURATION_CONFIGS } from '../utils/datetime';

import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';

import styles from './styles.module.scss';

const timeConfig = HUMANIZED_DURATION_CONFIGS.ABBREVIATED_FORMAT;
timeConfig.units = ['h', 'm'];
const getHumanizedTimeDuration =  durationHumanizer(timeConfig);

const TimePicker = ({
  maxTime,
  minutesInterval,
  onChange,
  optionsToDisplay,
  showDurationFromStartTime,
  startTime,
  value,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [writtenValue, setWrittenValue] = useState(null);

  const isTimeBelowMax = useCallback((time) => !maxTime || maxTime >= time, [maxTime]);

  const TimeOptionsPopover = useMemo(() => {
    const initialTimeParts = (startTime || value).split(':');
    const initialTimeDate = new Date();
    initialTimeDate.setHours(initialTimeParts[0], initialTimeParts[1], '00');

    const millisecondsInterval = 1000 * 60 * minutesInterval;
    initialTimeDate.setTime(Math.floor(initialTimeDate.getTime() / millisecondsInterval) * millisecondsInterval);

    const options = [];
    let accumulatedMinutes = minutesInterval;

    while (options.length < optionsToDisplay) {
      const dateWithAccumulation = addMinutes(initialTimeDate, accumulatedMinutes);
      const timeValue = getHoursAndMinutesString(dateWithAccumulation);

      options.push({
        disabled: !isTimeBelowMax(timeValue),
        duration: showDurationFromStartTime
          ? ` (${getHumanizedTimeDuration(differenceInMilliseconds(dateWithAccumulation, initialTimeDate))})`
          : null,
        value: timeValue,
      });

      accumulatedMinutes += minutesInterval;
    }

    if (options.slice(-1)?.[0]?.value === value) {
      options.pop();
    }

    return <Popover className={styles.popoverOptions}>
      <ul data-testid="timePicker-popoverOptionsList">
        {options.map((option) => <li
          className={option.disabled ? styles.disabled : ''}
          key={option.value}
          onClick={() => !option.disabled && onChange(option.value)}
          onMouseDown={(event) => option.disabled && event.preventDefault()}
        >
          <span>{option.value}</span>
          {option.duration && <span>{option.duration}</span>}
        </li>)}
      </ul>
    </Popover>;
  }, [isTimeBelowMax, minutesInterval, onChange, optionsToDisplay, showDurationFromStartTime, startTime, value]);

  const handleChange = useCallback((event) => setWrittenValue(event.target.value), [setWrittenValue]);

  const onKeyDown = useCallback((event) => event.key === 'Enter' && event.target.blur(), []);

  const onToggle = useCallback((show) => {
    setIsOpen(show);

    if (!show && writtenValue) {
      if (isTimeBelowMax(writtenValue)) {
        onChange(writtenValue);
      }

      setWrittenValue(null);
    }
  }, [isTimeBelowMax, onChange, writtenValue]);

  return <div className={styles.inputWrapper}>
    <ClockIcon/>

    <OverlayTrigger
      onToggle={onToggle}
      overlay={TimeOptionsPopover}
      placement="bottom-start"
      trigger="focus"
    >
      <input
        className={styles.timeInput}
        data-testid="time-input"
        min={startTime || '00:00'}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        type="time"
        value={writtenValue || value}
      />
    </OverlayTrigger>

    <div className={`${styles.triangle} ${isOpen ? styles.open : ''}`} data-testid="time-input-triangle-arrow" />
  </div>;
};

TimePicker.defaultProps = {
  maxTime: '',
  minutesInterval: 30,
  optionsToDisplay: 5,
  showDurationFromStartTime: false,
  startTime: '',
  value: '',
};

TimePicker.propTypes = {
  maxTime: PropTypes.string,
  minutesInterval: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  optionsToDisplay: PropTypes.number,
  showDurationFromStartTime: PropTypes.bool,
  startTime: PropTypes.string,
  value: PropTypes.string,
};

export default memo(TimePicker);
