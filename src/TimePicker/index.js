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

  const hourInputRef = useRef();
  const innerRef = useRef();
  // We use a ref to track the focus state to avoid calling onFocus several times when the user changes focus between
  // the inner elements of the wrapper.
  const isFocusedRef = useRef(false);
  const minuteInputRef = useRef();
  const optionsPopoverButtonRef = useRef();
  const periodInputRef = useRef();
  const shouldAutofillHourOnBlurRef = useRef(true);
  const shouldAutofillMinuteOnBlurRef = useRef(true);

  useImperativeHandle(ref, () => innerRef.current);

  // We calculate the hour format depending on the user's locale.
  const use12HourFormat = shouldUse12HourFormat(i18n.language);

  // The value is expected to come as a string in format HH:mm so we break it down to its parts. The time may be
  // transformed into a 12 hour format depending on the user's locale.
  const [hour, minute, periodFromValue] = useMemo(() => {
    const [hour = '', minute = ''] = value.split(':');
    if (use12HourFormat) {
      const [hourIn12Format, period] = transform24To12HourFormat(hour);
      return [hourIn12Format, minute, period];
    }
    return [hour, minute, null];
  }, [use12HourFormat, value]);

  const [isOptionsPopoverOpen, setIsOptionsPopoverOpen] = useState(false);
  // Period is the only input that is handled locally since the value is always a 24 hour format.
  const [period, setPeriod] = useState(periodFromValue || AM_PERIOD);

  const internationalizedTimePeriods = getInternationalizedTimePeriods(i18n.language);

  // Instead of calling onChange, we use this method as a proxy to first transform the value to 24 hour format before
  // commiting any change.
  const onTransformTo24HourAndChange = (hour, minute, period) => {
    const hourIn24Format = use12HourFormat ? transform12To24HourFormat(hour, period) : hour;
    onChange(`${hourIn24Format}:${minute}`);
  };

  // Since our picker is a group of inputs, we handle the blurring from the wrapper but make sure to not call onBlur
  // when changing focus within the inner inputs.
  const onWrapperBlur = (event) => {
    if (!innerRef.current.contains(event.relatedTarget)) {
      onBlur?.(event);
      isFocusedRef.current = false;

      // If we are using 12 hour format, we validate the time range on blur because the way the period affects the hour
      // is tricky to validate while the user changes the inputs.
      if (use12HourFormat) {
        const [
          hourWithinValidRange,
          minuteWithinValidRange,
          periodWithinValidRange,
        ] = get12HourFormatTimeWithinValidRange(hour, minute, period, max, min);

        if (hour !== hourWithinValidRange || minute !== minuteWithinValidRange || period !== periodWithinValidRange) {
          setPeriod(periodWithinValidRange);
          onTransformTo24HourAndChange(hourWithinValidRange, minuteWithinValidRange, periodWithinValidRange);
        }
      }
    }
  };

  // Like the blur, we handle the focus callback from the wrapper.
  const onWrapperFocus = (event) => {
    if (event.target === innerRef.current) {
      // We forward the initial focusing to the hour input.
      hourInputRef.current.focus();
    } else if (!isFocusedRef.current) {
      // Once an inner element has the focus, we trigger onFocus and update the state.
      onFocus?.(event);
      isFocusedRef.current = true;
    }
  };

  const onHourChange = (newHour) => {
    if (use12HourFormat) {
      onTransformTo24HourAndChange(newHour, minute, period);
    } else {
      // For 24 hour format we do validations with every change.
      const hourWithinValidRange = getHourWithinValidRange(newHour, max, min, use12HourFormat);
      const minuteWithinValidRange = getMinuteWithinValidRange(minute, hourWithinValidRange, max, min, use12HourFormat);

      onTransformTo24HourAndChange(hourWithinValidRange, minuteWithinValidRange, period);
    }
  };

  const onHourInputBlur = () => {
    // If the hour input is blurred and the user left a single digit we autofill the first one with a zero, unless we
    // moved the focus programatically after the user typed a valid hour.
    if (shouldAutofillHourOnBlurRef.current && shouldCompleteFirstHourDigitWithZero(hour)) {
      onHourChange(`0${hour}`);
    }

    shouldAutofillHourOnBlurRef.current = true;
  };

  const onHourInputChange = (event) => {
    let newHour = null;
    if (!isSecondHourDigitPossible(event.target.value, use12HourFormat)) {
      // Autofill the first digit with a zero if the user typed a number above 1 for 12 hour format or above 2 for 24
      // hour format.
      newHour = `0${event.target.value}`;
    } else if (isValidHourInput(event.target.value, use12HourFormat) || event.target.value === '') {
      newHour = event.target.value;
    }

    if (newHour !== null) {
      onHourChange(newHour);

      // Automatically move the focus to the minute input if the user finished typing a valid hour.
      if (isHourInputComplete(newHour, use12HourFormat)) {
        shouldAutofillHourOnBlurRef.current = false;
        minuteInputRef.current.focus();
      }
    }
  };

  // Keyboard navigation for the hour input.
  const onHourInputKeyDown = (event) => {
    switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();

      // Decrease the hour when the user presses the down arrow.
      const lowestPossibleHour = use12HourFormat ? 1 : 0;
      if (hour === '' || parseInt(hour) === lowestPossibleHour) {
        onHourChange(use12HourFormat ? '12' : '23');
      } else if (isValidHourInput(hour, use12HourFormat)) {
        const hourMinusOne = (parseInt(hour) - 1).toString().padStart(2, '0');
        onHourChange(hourMinusOne);
      }
      break;

    case 'ArrowLeft':
      event.preventDefault();

      hourInputRef.current.select();
      break;

    case 'ArrowRight':
      event.preventDefault();

      minuteInputRef.current.focus();
      break;

    case 'ArrowUp':
      event.preventDefault();

      // Increase the hour when the user presses the up arrow.
      const highestPossibleHour = use12HourFormat ? '12' : '23';
      if (hour === '' || hour === highestPossibleHour) {
        onHourChange(use12HourFormat ? '01' : '00');
      } else if (isValidHourInput(hour, use12HourFormat)) {
        const hourPlusOne = (parseInt(hour) + 1).toString().padStart(2, '0');
        onHourChange(hourPlusOne);
      }
      break;

    default:
      break;
    }
  };

  const onMinuteChange = (newMinute) => {
    if (use12HourFormat) {
      onTransformTo24HourAndChange(hour, newMinute, period);
    } else {
      // For 24 hour format we do validations with every change.
      const minuteWithinValidRange = getMinuteWithinValidRange(newMinute, hour, max, min, use12HourFormat);

      onTransformTo24HourAndChange(hour, minuteWithinValidRange, period);
    }
  };

  const onMinuteInputBlur = () => {
    // If the minute input is blurred and the user left a single digit we autofill the first one with a zero, unless we
    // moved the focus programatically after the user typed a valid minute.
    if (shouldAutofillMinuteOnBlurRef.current && shouldCompleteFirstMinuteDigitWithZero(minute)) {
      onMinuteChange(`0${minute}`);
    }

    shouldAutofillMinuteOnBlurRef.current = true;
  };

  const onMinuteInputChange = (event) => {
    let newMinute = null;
    if (!isSecondMinuteDigitPossible(event.target.value)) {
      // Autofill the first digit with a zero if the user typed a number above 5.
      newMinute = `0${event.target.value}`;
    } else if (isValidMinuteInput(event.target.value) || event.target.value === '') {
      newMinute = event.target.value;
    }

    if (newMinute !== null) {
      onMinuteChange(newMinute);

      // Automatically move the focus to the period input if we are using 12 hour format and the user finished typing
      // a valid minute.
      if (use12HourFormat && isMinuteInputComplete(newMinute)) {
        shouldAutofillMinuteOnBlurRef.current = false;
        periodInputRef.current.focus();
      }
    }
  };

  // Keyboard navigation for the minute input.
  const onMinuteInputKeyDown = (event) => {
    switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();

      // Decrease the minute when the user presses the down arrow.
      if (minute === '' || parseInt(minute) === 0) {
        onMinuteChange('59');
      } else if (isValidMinuteInput(minute)) {
        const minuteMinusOne = (parseInt(minute) - 1).toString().padStart(2, '0');
        onMinuteChange(minuteMinusOne);
      }
      break;

    case 'ArrowLeft':
      event.preventDefault();

      hourInputRef.current.focus();
      break;

    case 'ArrowRight':
      event.preventDefault();

      if (use12HourFormat) {
        periodInputRef.current.focus();
      } else {
        minuteInputRef.current.select();
      }
      break;

    case 'ArrowUp':
      event.preventDefault();

      // Increase the minute when the user presses the up arrow.
      if (minute === '' || minute === '59') {
        onMinuteChange('00');
      } else if (isValidMinuteInput(minute)) {
        const minutePlusOne = (parseInt(minute) + 1).toString().padStart(2, '0');
        onMinuteChange(minutePlusOne);
      }
      break;

    default:
      break;
    }
  };

  // Keyboard navigation for the period input.
  const onPeriodInputKeyDown = (event) => {
    switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault();

      minuteInputRef.current.focus();
      break;

    case 'ArrowUp':
    case 'ArrowDown':
      event.preventDefault();

      // Switch the period when user presses up and down arrows.
      const newPeriod = period === AM_PERIOD ? PM_PERIOD : AM_PERIOD;
      setPeriod(newPeriod);
      onTransformTo24HourAndChange(hour, minute, newPeriod);
      break;

    case 'ArrowRight':
      event.preventDefault();

      event.target.select();
      break;

    case internationalizedTimePeriods[AM_PERIOD][0].toLocaleLowerCase():
    case internationalizedTimePeriods[AM_PERIOD][0].toLocaleUpperCase():
      event.preventDefault();

      // If the user types the first localized character of the AM period we trigger a change.
      setPeriod(AM_PERIOD);
      onTransformTo24HourAndChange(hour, minute, AM_PERIOD);
      break;

    case internationalizedTimePeriods[PM_PERIOD][0].toLocaleLowerCase():
    case internationalizedTimePeriods[PM_PERIOD][0].toLocaleUpperCase():
      event.preventDefault();

      // Same for PM period.
      setPeriod(PM_PERIOD);
      onTransformTo24HourAndChange(hour, minute, PM_PERIOD);
      break;

    default:
      break;
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

  const onCloseOptionsPopover = () => {
    setIsOptionsPopoverOpen(false);
    // We focus the options popover button automatically when the popover closes.
    optionsPopoverButtonRef.current.focus();
  };

  useEffect(() => {
    if (document.activeElement === hourInputRef.current && isHourInputComplete(hour, use12HourFormat)) {
      hourInputRef.current.select();
    }
  }, [hour, use12HourFormat]);

  useEffect(() => {
    if (document.activeElement === minuteInputRef.current && isMinuteInputComplete(minute)) {
      minuteInputRef.current.select();
    }
  }, [minute]);

  useEffect(() => {
    if (document.activeElement === periodInputRef.current) {
      periodInputRef.current.select();
    }
  }, [period]);

  useEffect(() => {
    // Since this is a controlled component, we need to check if the parent updates the value and the calculated period
    // doesn't match the locally stored one. In that case we just update the local state.
    if (periodFromValue && period !== periodFromValue && isValidTime(value)) {
      setPeriod(periodFromValue);
    }
  }, [period, periodFromValue, value]);

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
      onBlur={onHourInputBlur}
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
      onBlur={onMinuteInputBlur}
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
      onClick={(event) => event.target.select()}
      onFocus={(event) => event.target.select()}
      onKeyDown={onPeriodInputKeyDown}
      readOnly={readOnly}
      ref={periodInputRef}
      type="text"
      value={internationalizedTimePeriods[period]}
    />}

    <button
      aria-controls="timePicker-optionsPopover"
      aria-expanded={isOptionsPopoverOpen}
      aria-haspopup="listbox"
      aria-label={t('optionsPopoverButtonLabel')}
      className={styles.optionsPopoverButton}
      disabled={disabled || readOnly}
      onClick={() => isOptionsPopoverOpen ? onCloseOptionsPopover() : setIsOptionsPopoverOpen(true)}
      ref={optionsPopoverButtonRef}
      type="button"
    >
      <div className={`${styles.caret} ${isOptionsPopoverOpen ? styles.open : ''}`} role="img" />
    </button>

    <Overlay target={innerRef} show={isOptionsPopoverOpen} placement="bottom-end">
      <OptionsPopover
        internationalizedTimePeriods={internationalizedTimePeriods}
        max={max}
        min={min}
        minutesInterval={minutesInterval}
        onChange={onOptionsPopoverChange}
        onClose={onCloseOptionsPopover}
        optionsPopoverButtonRef={optionsPopoverButtonRef}
        showDurationFromMin={showDurationFromMin}
        target={innerRef}
        value={value}
      />
    </Overlay>

    <input data-testid="timePicker-input" name={name} type="hidden" value={value} />
  </div>;
};

export { EMPTY_TIME_VALUE, isValidTime };

export default memo(forwardRef(TimePicker));
