import React, { forwardRef, useEffect, useMemo, useRef } from 'react';
import { addMinutes, differenceInMilliseconds } from 'date-fns';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

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


const buildTimeDurationHumanizer = (translate) => {
  const abbreviations = {
    y: () => translate('year'),
    mo: () => translate('month'),
    w: () => translate('week'),
    d: () => translate('day'),
    h: () => translate('hour'),
    m: () => translate('minute'),
    s: () => translate('second'),
  };

  const TIME_CONFIG = HUMANIZED_DURATION_CONFIGS.ABBREVIATED_FORMAT(abbreviations);
  TIME_CONFIG.units = ['h', 'm'];
  return durationHumanizer(TIME_CONFIG);
};

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
  const { t } = useTranslation('dates', { keyPrefix: 'timeUnitAbbreviations' });

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

  const getHumanizedTimeDuration = useMemo(() => buildTimeDurationHumanizer(t), [t]);

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

      if (currentMinutesDiff > 0 && currentMinutesDiff < diffMinutes){
        diffMinutes = currentMinutesDiff;
        nearestHourIndex = arrayIndex;
      }

      let duration = null;
      if (showDurationFromMinTime) {
        const minTimeParts = minTime.split(':');
        const minTimeDate = new Date();
        minTimeDate.setHours(minTimeParts[0], minTimeParts[1], '00');

        const isDateOverMinTimeDate =  dateWithAccumulation > minTimeDate;
        const correctiveMilisecondsForDuration = isDateOverMinTimeDate ? 59999 : 0;
        const millisecondsFromMinTime = differenceInMilliseconds(dateWithAccumulation, minTimeDate);
        const humanizedDuration = getHumanizedTimeDuration(millisecondsFromMinTime + correctiveMilisecondsForDuration);
        const sign = isDateOverMinTimeDate || humanizedDuration === '0m' ? '' : '-';

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

    if ( nearestHourIndex > -1 ){
      options[nearestHourIndex].ref = defaultTimeRef;
    }

    return options;
  }, [
    optionsToDisplay,
    initialDate,
    currentValueDate,
    isTimeBelowMax,
    minTime,
    showDurationFromMinTime,
    minutesInterval,
    getHumanizedTimeDuration
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

const OptionsPopoverForwardRef = forwardRef(OptionsPopover);

OptionsPopoverForwardRef.defaultProps = {
  className: '',
  minTime: '',
  minutesInterval: 30,
  showDurationFromMinTime: false,
  value: '',
};

OptionsPopoverForwardRef.propTypes = {
  className: PropTypes.string,
  isTimeBelowMax: PropTypes.func.isRequired,
  minTime: PropTypes.string,
  minutesInterval: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  showDurationFromMinTime: PropTypes.bool,
  value: PropTypes.string,
};

export default OptionsPopoverForwardRef;
