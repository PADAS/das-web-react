import React, { forwardRef, memo, useEffect, useMemo, useRef } from 'react';
import addMinutes from 'date-fns/add_minutes';
import differenceInMilliseconds from 'date-fns/difference_in_milliseconds';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';

import {
  durationHumanizer,
  getHoursAndMinutesString,
  getUserLocaleTime,
  HUMANIZED_DURATION_CONFIGS,
} from '../../utils/datetime';

import styles from './styles.module.scss';

const SECONDS = 60;
const HOURS = 24;
const MILLISECONDS = 60000;

const TIME_CONFIG = HUMANIZED_DURATION_CONFIGS.ABBREVIATED_FORMAT;
TIME_CONFIG.units = ['h', 'm'];

const getHumanizedTimeDuration = durationHumanizer(TIME_CONFIG);

const getMinutesDiff = (startDate, endDate) => Math.round(
  Math.abs(endDate.getTime() - startDate.getTime()) / MILLISECONDS
);

const OptionsPopover = ({
  className,
  isTimeBelowMax,
  minTime,
  minutesInterval,
  onChange,
  showDurationFromMinTime,
  value,
  ...rest
}, ref) => {
  const defaultTimeRef = useRef();

  const initialDate = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0);

    return date;
  }, []);

  const initialTimeString = useMemo(() => getHoursAndMinutesString(initialDate), [initialDate]);

  const [defaultHour, defaultMinutes] = useMemo(
    () => (value ?? initialTimeString).split(':'),
    [initialTimeString, value]
  );

  const optionsToDisplay = useMemo(() => Math.floor ((SECONDS / minutesInterval) * HOURS), [minutesInterval]);

  const currentValueDate = useMemo(() => {
    const date = new Date();
    date.setHours(defaultHour, defaultMinutes, 0);

    return date;
  }, [defaultHour, defaultMinutes]);

  const options = useMemo(() => {
    const options = [];
    let accumulatedMinutes = 0;
    let diffMinutes = Number.MAX_VALUE;
    let nearestHourIndex = -1;
    let arrayIndex = 0;

    while (options.length < optionsToDisplay) {
      const dateWithAccumulation = addMinutes(initialDate, accumulatedMinutes);
      const timeValue = getHoursAndMinutesString(dateWithAccumulation);
      const timeDisplay = getUserLocaleTime(dateWithAccumulation);
      const currentMinutesDiff = getMinutesDiff(dateWithAccumulation, currentValueDate);
      if (currentMinutesDiff < diffMinutes){
        diffMinutes = currentMinutesDiff;
        nearestHourIndex = arrayIndex;
      }

      let duration = null;
      if (showDurationFromMinTime) {
        const minTimeParts = minTime.split(':');
        const minTimeDate = new Date();
        minTimeDate.setHours(minTimeParts[0], minTimeParts[1], '00');

        const millisecondsFromMinTime = differenceInMilliseconds(dateWithAccumulation, minTimeDate);
        const humanizedDuration = getHumanizedTimeDuration(millisecondsFromMinTime);
        console.log(humanizedDuration);
        const sign = dateWithAccumulation > minTimeDate || humanizedDuration === '0m' ? '' : '-';

        duration = ` (${sign}${humanizedDuration})`;
      }

      options.push({
        disabled: !isTimeBelowMax(timeValue) || (minTime && minTime > timeValue),
        display: timeDisplay,
        duration,
        value: timeValue
      });

      accumulatedMinutes += minutesInterval;
      arrayIndex++;
    }

    if (options.slice(-1)?.[0]?.value === value) {
      options.pop();
    }

    if ( nearestHourIndex > -1 ){
      options[nearestHourIndex].ref = defaultTimeRef;
    }

    return options;
  }, [
    optionsToDisplay,
    value,
    initialDate,
    currentValueDate,
    isTimeBelowMax,
    minTime,
    showDurationFromMinTime,
    minutesInterval,
  ]);

  useEffect(() => {
    if (defaultTimeRef?.current){
      defaultTimeRef.current?.scrollIntoView?.();
    }
  }, []);

  return <Popover className={`${className} ${styles.asw}`} ref={ref} {...rest}>
    <ul data-testid="timePicker-OptionsList">
      {options.map((option) => <li
        className={option.disabled ? styles.disabled : ''}
        key={option.value}
        onClick={() => !option.disabled && onChange(option.value)}
        onMouseDown={(event) => option.disabled && event.preventDefault()}
        ref={option.ref}
        >
        <span>{option.display}</span>

        {option.duration && <span>{option.duration}</span>}
      </li>)}
    </ul>
  </Popover>;
};

OptionsPopover.defaultProps = {
  className: '',
  minTime: '',
  minutesInterval: 30,
  showDurationFromMinTime: false,
  value: '',
};

OptionsPopover.propTypes = {
  className: PropTypes.string,
  isTimeBelowMax: PropTypes.func.isRequired,
  minTime: PropTypes.string,
  minutesInterval: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  showDurationFromMinTime: PropTypes.bool,
  value: PropTypes.string,
};

export default memo(forwardRef(OptionsPopover));
