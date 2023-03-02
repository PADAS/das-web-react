import React, { forwardRef, memo, useEffect } from 'react';
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


// eslint-disable-next-line react/display-name
const TimeOptionsPopover = forwardRef(({ isTimeBelowMax, minutesInterval, onChange, showDurationFromStartTime, value }, ref) => {
  const initialTimeDate = new Date();
  const initialTime = getHoursAndMinutesString(initialTimeDate);
  const [defaultHour, defaultMinutes] = (value ?? initialTime).split(':');
  initialTimeDate.setHours(0, 0, 0);
  const optionsToDisplay = Math.floor ((60 / minutesInterval) * 24);
  const currentDateValue = new Date();
  currentDateValue.setHours(defaultHour, defaultMinutes, 0);

  const options = [];
  let accumulatedMinutes = 0;

  const getDiff = (startDate, endDate) => {
    const diff = endDate.getTime() - startDate.getTime();
    return  Math.round(diff / 60000);
  };

  while (options.length < optionsToDisplay) {
    const dateWithAccumulation = addMinutes(initialTimeDate, accumulatedMinutes);
    const timeValue = getHoursAndMinutesString(dateWithAccumulation);
    const timeDisplay = getUserLocaleTime(dateWithAccumulation);
    /*
        const nextDateItem = addMinutes(initialTimeDate, accumulatedMinutes + minutesInterval);
  
        const curentDateDiff = getDiff(dateWithAccumulation)*/


    const [currentHour, currentMinutes] = timeValue.split(':');
    const nextMinutesInterval = parseInt(currentMinutes) + minutesInterval;
    const isSameHour = parseInt(currentHour) === parseInt(defaultHour);
    const isBetweenMinutes = parseInt(defaultMinutes) > parseInt(currentMinutes) && parseInt(defaultMinutes) < nextMinutesInterval;

    options.push({
      disabled: !isTimeBelowMax(timeValue),
      display: timeDisplay,
      duration: showDurationFromStartTime
        ? ` (${getHumanizedTimeDuration(differenceInMilliseconds(dateWithAccumulation, initialTimeDate))})`
        : null,
      value: timeValue,
      defaultTimeRef: isSameHour && isBetweenMinutes ? ref : null
    });

    accumulatedMinutes += minutesInterval;
  }

  if (options.slice(-1)?.[0]?.value === value) {
    options.pop();
  }

  useEffect(() => {
    console.log(ref);
    if (ref?.current){
      ref.current?.scrollIntoView();
    }
  }, []);

  return <ul data-testid="timePicker-popoverOptionsList">
    {options.map((option) => <li
                className={option.disabled ? styles.disabled : ''}
                key={option.value}
                onClick={() => !option.disabled && onChange(option.value)}
                onMouseDown={(event) => option.disabled && event.preventDefault()}
                ref={option.defaultTimeRef}
            >
      <span>{option.display}</span>
      {option.duration && <span>{option.duration}</span>}
    </li>)}
  </ul>;
});

export default memo(TimeOptionsPopover);