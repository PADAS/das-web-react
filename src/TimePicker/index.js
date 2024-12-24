import React, { forwardRef, memo, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import Overlay from 'react-bootstrap/Overlay';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';

import {
  AM_PERIOD,
  EMPTY_TIME_VALUE,
  get12HourFormatTimeWithinValidRange,
  getHourWithinValidRange,
  getInternationalizedTimePeriods,
  getMinuteWithinValidRange,
  isHourInputComplete,
  isMinuteInputComplete,
  isSecondHourDigitPossible,
  isSecondMinuteDigitPossible,
  isValidHourInput,
  isValidMinuteInput,
  isValidTime,
  PM_PERIOD,
  shouldCompleteFirstHourDigitWithZero,
  shouldCompleteFirstMinuteDigitWithZero,
  shouldUse12HourFormat,
  transform12To24HourFormat,
  transform24To12HourFormat,
} from './utils';

import OptionsPopover from './OptionsPopover';

import styles from './styles.module.scss';

const HOUR_INPUT_PLACEHOLDER = '--';
const MINUTE_INPUT_PLACEHOLDER = '--';

const TimePicker = ({
  className = '',
  disabled = false,
  max = '',
  min = '',
  minutesInterval = 30,
  name = '',
  onBlur = null,
  onChange,
  onFocus = null,
  readOnly = false,
  required = false,
  showDurationFromMin = false,
  value,
  ...otherProps
}, ref) => {
  const { i18n, t } = useTranslation('components', { keyPrefix: 'timePicker' });

  const innerRef = useRef();
  const hourInputRef = useRef();
  const menuButtonRef = useRef();
  const minuteInputRef = useRef();
  const periodInputRef = useRef();

  useImperativeHandle(ref, () => innerRef.current);

  const use12HourFormat = shouldUse12HourFormat(i18n.language);

  // Value is expected to come as a string in format HH:mm so we break it down to its parts. The time may be
  // transformed into a 12 hour format depending on the user's locale.
  const [hour, minute, periodFromValue] = useMemo(() => {
    const [hour = '', minute = ''] = value.split(':');

    if (use12HourFormat) {
      const [hourIn12Format, period] = transform24To12HourFormat(hour);
      return [hourIn12Format, minute, period];
    }
    return [hour, minute, null];
  }, [use12HourFormat, value]);

  const [isFocused, setIsFocused] = useState(false);
  const [isOptionsPopoverOpen, setIsOptionsPopoverOpen] = useState(false);
  // Period is the only input that is handled locally since the value is always a 24 hour format, so we need to do
  // transformations between formats locally.
  const [period, setPeriod] = useState(periodFromValue || AM_PERIOD);

  const internationalizedTimePeriods = getInternationalizedTimePeriods(i18n.language);

  // Instead of calling onChange, we use this method always to first transform the value to 24 hour format before
  // commiting any change.
  const onTransformTo24HourAndChange = (hour, minute, period) => {
    const hourIn24Format = use12HourFormat ? transform12To24HourFormat(hour, period) : hour;
    onChange(`${hourIn24Format}:${minute}`);
  };

  // Since our picker is a group of inputs, we handle the blurring from the wrapper but make sure to not call it when
  // changing focus within the inner inputs.
  const onWrapperBlur = (event) => {
    if (!innerRef.current.contains(event.relatedTarget)) {
      onBlur?.(event);
      setIsFocused(false);

      // If we are using 12 hour format, we validate the time range on blur because the period affects the hour but its
      // the last input so validating while changing each input results in a weird behavior.
      if (use12HourFormat) {
        const [
          hourWithinValidRange,
          minuteWithinValidRange,
          periodWithinValidRange,
        ] = get12HourFormatTimeWithinValidRange(hour, minute, period, max, min);

        setPeriod(periodWithinValidRange);
        onTransformTo24HourAndChange(hourWithinValidRange, minuteWithinValidRange, periodWithinValidRange);
      }
    }
  };

  // Similarly, we handle the focus callback.
  const onWrapperFocus = (event) => {
    if (event.target === innerRef.current) {
      hourInputRef.current.focus();
    } else if (!isFocused) {
      onFocus?.(event);
      setIsFocused(true);
    }
  };

  const onHourChange = (newHour) => {
    if (!use12HourFormat) {
      const hourWithinValidRange = getHourWithinValidRange(newHour, max, min, use12HourFormat);
      const minuteWithinValidRange = getMinuteWithinValidRange(minute, hourWithinValidRange, max, min, use12HourFormat);

      onTransformTo24HourAndChange(hourWithinValidRange, minuteWithinValidRange, period);
    } else {
      onTransformTo24HourAndChange(newHour, minute, period);
    }
  };

  const onHourInputChange = (event) => {
    const newHour = event.target.value;
    if (!isSecondHourDigitPossible(newHour, use12HourFormat)) {
      // Autofill the first digit when the user enters a number that can't have a digit after it to be a valid hour.
      onHourChange(`0${newHour}`);
    } else if (isValidHourInput(newHour, use12HourFormat) || newHour === '') {
      onHourChange(newHour);
    }
  };

  const onHourInputKeyDown = (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();

      minuteInputRef.current.focus();
    }
  };

  const onMinuteChange = (newMinute) => {
    if (!use12HourFormat) {
      const minuteWithinValidRange = getMinuteWithinValidRange(newMinute, hour, max, min, use12HourFormat);

      onTransformTo24HourAndChange(hour, minuteWithinValidRange, period);
    } else {
      onTransformTo24HourAndChange(hour, newMinute, period);
    }
  };

  const onMinuteInputChange = (event) => {
    const newMinute = event.target.value;
    if (!isSecondMinuteDigitPossible(newMinute)) {
      // Autofill the first digit when the user enters a number that can't have a digit after it to be a valid minute.
      onMinuteChange(`0${newMinute}`);
    } else if (isValidMinuteInput(newMinute) || newMinute === '') {
      onMinuteChange(newMinute);
    }
  };

  const onMinuteInputKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();

      hourInputRef.current.focus();
    } else if (use12HourFormat && event.key === 'ArrowRight') {
      event.preventDefault();

      periodInputRef.current.focus();
    }
  };

  const onPeriodInputChange = (event) => {
    let newPeriod = null;
    // The only accepted values are AM and PM periods.
    if (event.target.value === internationalizedTimePeriods[AM_PERIOD][0].toLocaleLowerCase()
      || event.target.value === internationalizedTimePeriods[AM_PERIOD][0].toLocaleUpperCase()) {
      newPeriod = AM_PERIOD;
    } else if (event.target.value === internationalizedTimePeriods[PM_PERIOD][0].toLocaleLowerCase()
      || event.target.value === internationalizedTimePeriods[PM_PERIOD][0].toLocaleUpperCase()) {
      newPeriod = PM_PERIOD;
    }

    if (newPeriod) {
      setPeriod(newPeriod);
      onTransformTo24HourAndChange(hour, minute, newPeriod);
    }
  };

  const onPeriodInputKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();

      minuteInputRef.current.focus();
    } else {
      event.target.select();
    }
  };

  const onOptionsPopoverChange = (newTime) => {
    // Since the options popover returns the new time already in 24 hour format, we calculate the period and set it if
    // we are using 12 hour format.
    if (use12HourFormat) {
      const [newHour] = newTime.split(':');
      const [_, newPeriod] = transform24To12HourFormat(newHour);

      setPeriod(newPeriod);
    }

    onChange(newTime);
  };

  useEffect(() => {
    if (document.activeElement === hourInputRef.current && isHourInputComplete(hour, use12HourFormat)) {
      minuteInputRef.current.focus();
    }
  }, [hour, use12HourFormat]);

  useEffect(() => {
    if (use12HourFormat
      && document.activeElement === minuteInputRef.current
      && isMinuteInputComplete(minute)) {
      periodInputRef.current.focus();
    }
  }, [minute, use12HourFormat]);

  useEffect(() => {
    if (document.activeElement === periodInputRef.current) {
      periodInputRef.current.select();
    }
  }, [period]);

  useEffect(() => {
    if (!isOptionsPopoverOpen) {
      menuButtonRef.current.focus();
    }
  }, [isOptionsPopoverOpen]);

  useEffect(() => {
    // If we are using 12 hour format and a valid time value is set but the calculated period doesn't match the locally
    // store period, we update it.
    if (use12HourFormat && periodFromValue && period !== periodFromValue && isValidTime(value)) {
      setPeriod(periodFromValue);
    }
  }, [period, periodFromValue, use12HourFormat, value]);

  return <div
      className={`${styles.timePicker} ${use12HourFormat ? styles.twelveHourFormat : ''} ${disabled ? styles.disabled : ''} ${className}`}
      onBlur={onWrapperBlur}
      onFocus={onWrapperFocus}
      ref={innerRef}
      role="group"
      tabIndex={disabled ? -1 : 0}
      {...otherProps}
    >
    <ClockIcon className={styles.clockIcon} />

    <input
      aria-label={t('hourInputLabel')}
      className={styles.hourInput}
      disabled={disabled}
      inputMode="numeric"
      onBlur={() => shouldCompleteFirstHourDigitWithZero(hour) && onHourChange(`0${hour}`)}
      onChange={onHourInputChange}
      onFocus={(event) => event.target.select()}
      onKeyDown={onHourInputKeyDown}
      pattern="[0-9]{0,2}"
      placeholder={HOUR_INPUT_PLACEHOLDER}
      readOnly={readOnly}
      ref={hourInputRef}
      required={required}
      type="text"
      value={hour}
    />

    <span className={styles.colon}>:</span>

    <input
      aria-label={t('minuteInputLabel')}
      className={styles.minuteInput}
      disabled={disabled}
      inputMode="numeric"
      onBlur={() => shouldCompleteFirstMinuteDigitWithZero(minute) && onMinuteChange(`0${minute}`)}
      onChange={onMinuteInputChange}
      onFocus={(event) => event.target.select()}
      onKeyDown={onMinuteInputKeyDown}
      pattern="[0-9]{0,2}"
      placeholder={MINUTE_INPUT_PLACEHOLDER}
      readOnly={readOnly}
      ref={minuteInputRef}
      required={required}
      type="text"
      value={minute}
    />

    {use12HourFormat && <input
      aria-label={t('periodInputLabel')}
      className={styles.periodInput}
      disabled={disabled}
      onChange={onPeriodInputChange}
      onClick={(event) => event.target.select()}
      onFocus={(event) => event.target.select()}
      onKeyDown={onPeriodInputKeyDown}
      readOnly={readOnly}
      ref={periodInputRef}
      type="text"
      value={internationalizedTimePeriods[period]}
    />}

    <button
      aria-controls="timePicker-menuPopover"
      aria-expanded={isOptionsPopoverOpen}
      aria-haspopup="listbox"
      aria-label={t('menuButtonLabel')}
      className={styles.menuButton}
      disabled={disabled || readOnly}
      onClick={() => setIsOptionsPopoverOpen(!isOptionsPopoverOpen)}
      ref={menuButtonRef}
      type="button"
    >
      <div className={`${styles.caret} ${isOptionsPopoverOpen ? styles.open : ''}`} role="img" />
    </button>

    <Overlay target={innerRef} show={isOptionsPopoverOpen} placement="bottom-end">
      <OptionsPopover
        internationalizedTimePeriods={internationalizedTimePeriods}
        max={max}
        menuButtonRef={menuButtonRef}
        min={min}
        minutesInterval={minutesInterval}
        onChange={onOptionsPopoverChange}
        onClose={() => setIsOptionsPopoverOpen(false)}
        showDurationFromMin={showDurationFromMin}
        target={innerRef}
        value={value}
      />
    </Overlay>

    <input name={name} type="hidden" value={value} />
  </div>;
};

export { EMPTY_TIME_VALUE, isValidTime };

export default memo(forwardRef(TimePicker));
