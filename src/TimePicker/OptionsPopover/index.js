import React, { useEffect, useMemo, useRef, useState } from 'react';
import { addMinutes, differenceInMilliseconds } from 'date-fns';
import Popover from 'react-bootstrap/Popover';
import { useTranslation } from 'react-i18next';

import { AM_PERIOD, getMinutesDifference, isValidTime, PM_PERIOD } from '../utils';
import {
  durationHumanizer,
  getHoursAndMinutesString,
  getUserLocaleTime,
  HUMANIZED_DURATION_CONFIGS,
} from '../../utils/datetime';

import * as styles from './styles.module.scss';

const MINUTES_IN_AN_HOUR = 60;
const HOURS_IN_A_DAY = 24;

const OptionsPopover = ({
  className,
  id,
  internationalizedTimePeriods,
  max,
  min,
  minutesInterval,
  onChange,
  onClose,
  optionsPopoverButtonRef,
  ref,
  showDurationFromMin,
  style,
  target,
  value,
  ...otherProps
}) => {
  const { t } = useTranslation('dates', { keyPrefix: 'timeUnitAbbreviations' });

  const listRef = useRef();

  // State variable to track which option is currently selected by the keyboard navigation.
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(-1);

  const [options, indexOfOptionClosestToInputTime] = useMemo(() => {
    const options = [];

    const abbreviatedTimeConfig = HUMANIZED_DURATION_CONFIGS.ABBREVIATED_FORMAT({
      h: () => t('hour'),
      m: () => t('minute'),
    });
    abbreviatedTimeConfig.units = ['h', 'm'];
    const timeHumanizer = durationHumanizer(abbreviatedTimeConfig);

    const amountOfIntervalsInADay = Math.floor((MINUTES_IN_AN_HOUR / minutesInterval) * HOURS_IN_A_DAY);

    const midnight = new Date();
    midnight.setHours(0, 0, 0);

    const inputTimeValue = isValidTime(value) ? value : '00:00';
    const [inputHourValue, inputMinuteValue] = inputTimeValue.split(':');
    const dateWithInputTimeValue = new Date();
    dateWithInputTimeValue.setHours(inputHourValue, inputMinuteValue, 0);

    let closestMinutesDifferenceToInputTime = Number.MAX_VALUE;
    let currentOptionIndex = 0;
    let indexOfOptionClosestToInputTime = -1;
    // Iterate the amount of times the desired interval fits in a whole day.
    while (currentOptionIndex < amountOfIntervalsInADay) {
      // First we calculate the time value of the current option.
      const currentOptionMinutesSinceMidnight = currentOptionIndex * minutesInterval;
      const dateWithCurrentOptionTime = addMinutes(midnight, currentOptionMinutesSinceMidnight);
      const currentOptionValue = getHoursAndMinutesString(dateWithCurrentOptionTime);

      // If the current option time is outside the min and max boundaries, we don't add it.
      const isOptionValueWithinAllowedTimeRange = (!max || max >= currentOptionValue)
        && (!min || min <= currentOptionValue);
      if (isOptionValueWithinAllowedTimeRange) {
        // Calculate the display of the current option from its time based on the locale.
        const currentOptionDisplay = getUserLocaleTime(dateWithCurrentOptionTime)
          .replace('AM', internationalizedTimePeriods[AM_PERIOD])
          .replace('PM', internationalizedTimePeriods[PM_PERIOD]);

        // Update the index of the option closest to the current input value.
        const currentOptionMinutesDifferenceToInputTime = getMinutesDifference(
          dateWithCurrentOptionTime,
          dateWithInputTimeValue
        );
        if (currentOptionMinutesDifferenceToInputTime < closestMinutesDifferenceToInputTime) {
          closestMinutesDifferenceToInputTime = currentOptionMinutesDifferenceToInputTime;
          indexOfOptionClosestToInputTime = options.length;
        }

        // Finally, add the humanized duration from the minimum allowed value if it was requested.
        let currentOptionDurationFromMin = null;
        if (showDurationFromMin) {
          const [minHour, minMinute] = min.split(':');
          const dateWithMinTime = new Date();
          dateWithMinTime.setHours(minHour, minMinute, '00');

          const isCurrentOptionTimeOverMinTime = dateWithCurrentOptionTime > dateWithMinTime;
          const correctiveMilisecondsForDuration = isCurrentOptionTimeOverMinTime ? 59999 : 0;
          const currentOptionMillisecondsFromMin = differenceInMilliseconds(
            dateWithCurrentOptionTime,
            dateWithMinTime
          );

          const humanizedDuration = timeHumanizer(currentOptionMillisecondsFromMin + correctiveMilisecondsForDuration);
          const sign = isCurrentOptionTimeOverMinTime || humanizedDuration === '0m' ? '' : '-';
          currentOptionDurationFromMin = `${sign}${humanizedDuration}`;
        }

        options.push({
          display: currentOptionDisplay,
          durationFromMin: currentOptionDurationFromMin,
          value: currentOptionValue,
        });
      }

      currentOptionIndex += 1;
    }

    return [options, indexOfOptionClosestToInputTime];
  }, [
    internationalizedTimePeriods,
    max,
    min,
    minutesInterval,
    showDurationFromMin,
    t,
    value,
  ]);

  const getOptionDomId = (optionValue) => `${id}-${optionValue}`;

  const onItemSelection = (time) => {
    onChange(time);
    onClose();

    optionsPopoverButtonRef.current.focus();
  };

  // Keyboard navigation for the list.
  const onListKeyDown = (event) => {
    switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();

      setSelectedOptionIndex((selectedOptionIndex) => (selectedOptionIndex < (options.length - 1)
        ? selectedOptionIndex + 1
        : 0));
      break;

    case 'ArrowUp':
      event.preventDefault();

      setSelectedOptionIndex((selectedOptionIndex) => (selectedOptionIndex > 0
        ? selectedOptionIndex - 1
        : options.length - 1));
      break;

    case 'End':
      event.preventDefault();

      setSelectedOptionIndex(options.length - 1);
      break;

    case 'Enter':
    case ' ':
      event.preventDefault();

      if (options[selectedOptionIndex]) {
        onItemSelection(options[selectedOptionIndex].value);
      }
      break;

    case 'Escape':
      event.preventDefault();
      event.stopPropagation();

      onClose();

      optionsPopoverButtonRef.current.focus();
      break;

    case 'Home':
      event.preventDefault();

      setSelectedOptionIndex(0);
      break;

    case 'Tab':
      onClose();

      optionsPopoverButtonRef.current.focus();
      break;

    default:
      break;
    }
  };

  const getOnOptionClick = (option) => (event) => {
    event.stopPropagation();

    onItemSelection(option.value);
  };

  useEffect(() => {
    // Set the focus to the list on mount so keyboard navigation is enabled.
    listRef.current.focus();
  }, []);

  useEffect(() => {
    setSelectedOptionIndex(indexOfOptionClosestToInputTime);
  }, [indexOfOptionClosestToInputTime]);

  useEffect(() => {
    listRef.current.children[selectedOptionIndex]
      ?.scrollIntoView?.({ behavior: 'instant', block: 'nearest' });
  }, [selectedOptionIndex]);

  useEffect(() => {
    const onPointerDown = (event) => !listRef.current.contains(event.target)
      && !optionsPopoverButtonRef.current.contains(event.target)
      && onClose();

    document.addEventListener('pointerdown', onPointerDown);

    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [onClose, optionsPopoverButtonRef]);

  return <Popover
      className={`${className} ${styles.optionsPopover}`}
      id={id}
      ref={ref}
      role="presentation"
      style={{ ...style, width: target.current?.offsetWidth }}
      tabIndex="-1"
      {...otherProps}
    >
    <ul
      aria-activedescendant={options[selectedOptionIndex] && getOptionDomId(options[selectedOptionIndex].value)}
      className={styles.list}
      data-testid="timePicker-optionsList"
      onKeyDown={onListKeyDown}
      ref={listRef}
      role="listbox"
      tabIndex="-1"
    >
      {options.map((option, index) => <li
          aria-selected={selectedOptionIndex === index}
          className={`${styles.option} ${selectedOptionIndex === index ? styles.selected : ''}`}
          id={getOptionDomId(option.value)}
          key={option.value}
          onClick={getOnOptionClick(option)}
          role="option"
        >
        <span>{option.display}</span>

        {option.durationFromMin && <span className={styles.duration}>{option.durationFromMin}</span>}
      </li>)}
    </ul>
  </Popover>;
};

export default OptionsPopover;
