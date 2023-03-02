import React, { memo, useCallback, useEffect, useMemo, useRef} from 'react';
import {
  durationHumanizer,
  getHoursAndMinutesString,
  getUserLocaleTime,
  HUMANIZED_DURATION_CONFIGS
} from '../../utils/datetime';
import addMinutes from 'date-fns/add_minutes';
import differenceInMilliseconds from 'date-fns/difference_in_milliseconds';
import styles from '../styles.module.scss';

const timeConfig = HUMANIZED_DURATION_CONFIGS.ABBREVIATED_FORMAT;
timeConfig.units = ['h', 'm'];
const getHumanizedTimeDuration =  durationHumanizer(timeConfig);

const TimeOptionsPopover = ({ isTimeBelowMax, minutesInterval, onChange, showDurationFromStartTime, value }) => {

  const defaultTimeRef = useRef();
  const initialTimeDate = useMemo(() => new Date(), []);
  initialTimeDate.setHours(0, 0, 0);
  const initialTime = useMemo(() => getHoursAndMinutesString(initialTimeDate), [initialTimeDate]);
  const [defaultHour, defaultMinutes] = useMemo(() => (value ?? initialTime).split(':'), [value, initialTime]);
  const optionsToDisplay = useMemo(() => Math.floor ((60 / minutesInterval) * 24), [minutesInterval]);
  const currentValueDate = useMemo(() => new Date(), []);
  currentValueDate.setHours(defaultHour, defaultMinutes, 0);

  const getMinutesDiff = useCallback((startDate, endDate) => Math.round(
    Math.abs( endDate.getTime() - startDate.getTime() ) / 60000
  ), []);

  const options = useMemo(() => {
    const options = [];
    let accumulatedMinutes = 0;
    let diffMinutes = Number.MAX_VALUE;
    let nearestHourIndex = -1;
    let arrayIndex = 0;

    while (options.length < optionsToDisplay) {
      const dateWithAccumulation = addMinutes(initialTimeDate, accumulatedMinutes);
      const timeValue = getHoursAndMinutesString(dateWithAccumulation);
      const timeDisplay = getUserLocaleTime(dateWithAccumulation);
      const currentMinutesDiff = getMinutesDiff(dateWithAccumulation, currentValueDate);
      if (currentMinutesDiff < diffMinutes){
        diffMinutes = currentMinutesDiff;
        nearestHourIndex = arrayIndex;
      }

      options.push({
        disabled: !isTimeBelowMax(timeValue),
        display: timeDisplay,
        duration: showDurationFromStartTime
          ? ` (${getHumanizedTimeDuration(differenceInMilliseconds(dateWithAccumulation, initialTimeDate))})`
          : null,
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
  }, [initialTimeDate, isTimeBelowMax, minutesInterval, optionsToDisplay, defaultTimeRef, showDurationFromStartTime, value, currentValueDate, getMinutesDiff]);

  useEffect(() => {
    if (defaultTimeRef?.current){
      defaultTimeRef.current?.scrollIntoView();
    }
  }, []);

  return <ul data-testid="timePicker-popoverOptionsList">
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
  </ul>;
};

export default memo(TimeOptionsPopover);