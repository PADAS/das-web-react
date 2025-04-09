import React, { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CalendarIcon } from '../common/images/icons/calendar.svg';

import {
  EMPTY_DATE_VALUE,
  getDayWithinValidRange,
  getMonthWithinValidRange,
  getYearWithinValidRange,
  isDayInputComplete,
  isMonthInputComplete,
  isSecondDayDigitPossible,
  isSecondMonthDigitPossible,
  isValidDayInput,
  isValidMonthInput,
  isValidYearInput,
  isYearInputComplete,
  shouldCompleteFirstDayDigitWithZero,
  shouldCompleteFirstMonthDigitWithZero,
} from './utils';

import CalendarPopper from './CalendarPopper';

import * as styles from './styles.module.scss';

const DatePicker = ({
  className = '',
  dateSeparator = '/',
  disabled = false,
  max = '',
  min = '',
  name = '',
  onBlur = null,
  onChange,
  onFocus = null,
  reactDatePickerProps = {},
  readOnly = false,
  required = false,
  value,
  ...otherProps
}, ref) => {
  const { t } = useTranslation('components', { keyPrefix: 'datePicker' });

  const dayInputRef = useRef();
  const innerRef = useRef();
  const monthInputRef = useRef();
  const yearInputRef = useRef();
  const shouldAutofillMonthOnBlurRef = useRef(true);

  useImperativeHandle(ref, () => innerRef.current);

  // Value is expected to come as a string in format yyyy-MM-dd so we break it down to its parts.
  const [year = '', month = '', day = ''] = value.split('-');

  const [isCalendarPopperOpen, setIsCalendarPopperOpen] = useState(false);

  const onYearChange = (newYear) => {
    const yearWithinValidRange = getYearWithinValidRange(newYear, max, min);
    const monthWithinValidRange = getMonthWithinValidRange(month, yearWithinValidRange, max, min);
    const dayWithinValidRange = getDayWithinValidRange(day, monthWithinValidRange, yearWithinValidRange, max, min);

    onChange(`${yearWithinValidRange}-${monthWithinValidRange}-${dayWithinValidRange}`);
  };

  const onYearInputChange = (event) => {
    let newYear = null;
    if (isValidYearInput(event.target.value) || event.target.value === '') {
      newYear = event.target.value;
    }

    if (newYear !== null) {
      onYearChange(newYear);

      // Automatically move the focus to the month input if the user finished typing a valid year.
      if (isYearInputComplete(newYear)) {
        monthInputRef.current.focus();
      }
    }
  };

  // Keyboard navigation for the year input.
  const onYearInputKeyDown = (event) => {
    switch (event.key) {
    case 'ArrowDown':
      if (!readOnly) {
        event.preventDefault();

        // Decrease the year when the user presses the down arrow.
        if (isValidYearInput(year) && parseInt(year) > 0) {
          const yearMinusOne = (parseInt(year) - 1).toString().padStart(4, '0');
          onYearChange(yearMinusOne);
        }
      }
      break;

    case 'ArrowLeft':
      event.preventDefault();

      yearInputRef.current.select();
      break;

    case 'ArrowRight':
      event.preventDefault();

      monthInputRef.current.focus();
      break;

    case 'ArrowUp':
      if (!readOnly) {
        event.preventDefault();

        // Increase the year when the user presses the up arrow.
        if (isValidYearInput(year) && parseInt(year) < 9999) {
          const yearPlusOne = (parseInt(year) + 1).toString().padStart(4, '0');
          onYearChange(yearPlusOne);
        }
      }
      break;

    default:
      break;
    };
  };

  const onMonthChange = (newMonth) => {
    const monthWithinValidRange = getMonthWithinValidRange(newMonth, year, max, min);
    const dayWithinValidRange = getDayWithinValidRange(day, monthWithinValidRange, year, max, min);

    onChange(`${year}-${monthWithinValidRange}-${dayWithinValidRange}`);
  };

  const onMonthInputBlur = () => {
    // If the month input is blurred and the user left a single digit we autofill the first one with a zero, unless we
    // moved the focus programatically after the user typed a valid month.
    if (!readOnly && shouldAutofillMonthOnBlurRef.current && shouldCompleteFirstMonthDigitWithZero(month)) {
      onMonthChange(`0${month}`);
    }

    shouldAutofillMonthOnBlurRef.current = true;
  };

  const onMonthInputChange = (event) => {
    let newMonth = null;
    if (!isSecondMonthDigitPossible(event.target.value)) {
      // Autofill the first digit with a zero if the user typed a number above 1.
      newMonth = `0${event.target.value}`;
    } else if (isValidMonthInput(event.target.value) || event.target.value === '') {
      newMonth = event.target.value;
    }

    if (newMonth !== null) {
      onMonthChange(newMonth);

      // Automatically move the focus to the day if the user finished typing a valid month.
      if (isMonthInputComplete(newMonth)) {
        shouldAutofillMonthOnBlurRef.current = false;
        dayInputRef.current.focus();
      }
    }
  };

  // Keyboard navigation for the month input.
  const onMonthInputKeyDown = (event) => {
    switch (event.key) {
    case 'ArrowDown':
      if (!readOnly) {
        event.preventDefault();

        // Decrease the month when the user presses the down arrow.
        if (month === '' || parseInt(month) === 1) {
          onMonthChange('12');
        } else if (isValidMonthInput(month)) {
          const monthMinusOne = (parseInt(month) - 1).toString().padStart(2, '0');
          onMonthChange(monthMinusOne);
        }
      }
      break;

    case 'ArrowLeft':
      event.preventDefault();

      yearInputRef.current.focus();
      break;

    case 'ArrowRight':
      event.preventDefault();

      dayInputRef.current.focus();
      break;

    case 'ArrowUp':
      if (!readOnly) {
        event.preventDefault();

        // Increase the month when the user presses the up arrow.
        if (month === '' || month === '12') {
          onMonthChange('01');
        } else if (isValidMonthInput(month)) {
          const monthPlusOne = (parseInt(month) + 1).toString().padStart(2, '0');
          onMonthChange(monthPlusOne);
        }
      }
      break;

    default:
      break;
    }
  };

  const onDayChange = (newDay) => {
    const dayWithinValidRange = getDayWithinValidRange(newDay, month, year, max, min);

    onChange(`${year}-${month}-${dayWithinValidRange}`);
  };

  const onDayInputChange = (event) => {
    let newDay = null;
    if (!isSecondDayDigitPossible(event.target.value)) {
      // Autofill the first digit when the user enters a number that can't have a digit after it to be a valid day.
      newDay = `0${event.target.value}`;
    } else if (isValidDayInput(event.target.value) || event.target.value === '') {
      newDay = event.target.value;
    }

    if (newDay !== null) {
      onDayChange(newDay);
    }
  };

  const onDayInputKeyDown = (event) => {
    switch (event.key) {
    case 'ArrowDown':
      if (!readOnly) {
        event.preventDefault();

        // Decrease the day when the user presses the down arrow.
        if (day === '' || parseInt(day) === 1) {
          onDayChange('31');
        } else if (isValidDayInput(day)) {
          const dayMinusOne = (parseInt(day) - 1).toString().padStart(2, '0');
          onDayChange(dayMinusOne);
        }
      }
      break;

    case 'ArrowLeft':
      event.preventDefault();

      monthInputRef.current.focus();
      break;

    case 'ArrowRight':
      event.preventDefault();

      dayInputRef.current.select();
      break;

    case 'ArrowUp':
      if (!readOnly) {
        event.preventDefault();

        // Increase the day when the user presses the up arrow.
        if (day === '' || day === '31') {
          onDayChange('01');
        } else if (isValidDayInput(day)) {
          const dayPlusOne = (parseInt(day) + 1).toString().padStart(2, '0');
          onDayChange(dayPlusOne);
        }
      }
      break;

    default:
      break;
    }
  };

  useEffect(() => {
    if (document.activeElement === yearInputRef.current && isYearInputComplete(year)) {
      yearInputRef.current.select();
    }
  }, [year]);

  useEffect(() => {
    if (document.activeElement === monthInputRef.current && isMonthInputComplete(month)) {
      monthInputRef.current.select();
    }
  }, [month]);

  useEffect(() => {
    if (document.activeElement === dayInputRef.current && isDayInputComplete(day)) {
      dayInputRef.current.select();
    }
  }, [day]);

  return <div
      className={`${styles.datePicker} ${disabled ? styles.disabled : ''} ${className}`}
      // Since our picker is a group of inputs, we handle the blur and focus from the wrapper but make sure to not call
      // the methods if we are just changing focus within the inner inputs.
      onBlur={(event) => !innerRef.current.contains(event.relatedTarget) && onBlur?.(event)}
      onFocus={(event) => !innerRef.current.contains(event.relatedTarget) && onFocus?.(event)}
      ref={innerRef}
      role="group"
      {...otherProps}
    >
    <CalendarIcon className={styles.calendarIcon} />

    <input
      aria-label={t('yearInputLabel')}
      className={styles.yearInput}
      disabled={disabled}
      inputMode="numeric"
      onChange={onYearInputChange}
      onFocus={(event) => event.target.select()}
      onKeyDown={onYearInputKeyDown}
      pattern="[0-9]{0,4}"
      placeholder={t('yearInputPlaceholder')}
      readOnly={readOnly}
      ref={yearInputRef}
      required={required}
      type="text"
      value={year}
    />

    <span className={styles.dateSeparator}>{dateSeparator}</span>

    <input
      aria-label={t('monthInputLabel')}
      className={styles.monthInput}
      disabled={disabled}
      inputMode="numeric"
      onBlur={onMonthInputBlur}
      onChange={onMonthInputChange}
      onFocus={(event) => event.target.select()}
      onKeyDown={onMonthInputKeyDown}
      pattern="[0-9]{0,2}"
      placeholder={t('monthInputPlaceholder')}
      readOnly={readOnly}
      ref={monthInputRef}
      required={required}
      type="text"
      value={month}
    />

    <span className={styles.dateSeparator}>{dateSeparator}</span>

    <input
      aria-label={t('dayInputLabel')}
      className={styles.dayInput}
      disabled={disabled}
      inputMode="numeric"
      onBlur={() => !readOnly && shouldCompleteFirstDayDigitWithZero(day) && onDayChange(`0${day}`)}
      onChange={onDayInputChange}
      onFocus={(event) => event.target.select()}
      onKeyDown={onDayInputKeyDown}
      pattern="[0-9]{0,2}"
      placeholder={t('dayInputPlaceholder')}
      readOnly={readOnly}
      ref={dayInputRef}
      required={required}
      type="text"
      value={day}
    />

    <CalendarPopper
      disabled={disabled}
      isOpen={isCalendarPopperOpen}
      maxDate={max ? parseISO(max) : undefined}
      minDate={min ? parseISO(min) : undefined}
      onChange={onChange}
      readOnly={readOnly}
      setIsOpen={setIsCalendarPopperOpen}
      value={value}
      {...reactDatePickerProps}
    />

    <input data-testid="datePicker-input" name={name} type="hidden" value={value} />
  </div>;
};

export { EMPTY_DATE_VALUE };

export default memo(forwardRef(DatePicker));
