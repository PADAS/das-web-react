import React, { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CalendarIcon } from '../common/images/icons/calendar.svg';

import {
  EMPTY_DATE_VALUE,
  getDayWithinValidRange,
  getMonthWithinValidRange,
  getYearWithinValidRange,
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

import styles from './styles.module.scss';

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

  const innerRef = useRef();
  const dayInputRef = useRef();
  const monthInputRef = useRef();
  const yearInputRef = useRef();

  useImperativeHandle(ref, () => innerRef.current);

  const [isFocused, setIsFocused] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Value is expected to come as a string in format yyyy-MM-dd so we break it down to its parts.
  const [year = '', month = '', day = ''] = value.split('-');

  // Since our picker is a group of inputs, we handle the blurring from the wrapper but make sure to not call it when
  // changing focus within the inner inputs.
  const onWrapperBlur = (event) => {
    if (!innerRef.current.contains(event.relatedTarget)) {
      onBlur?.(event);
      setIsFocused(false);
    }
  };

  // Similarly, we handle the focus callback.
  const onWrapperFocus = (event) => {
    if (event.target === innerRef.current) {
      yearInputRef.current.focus();
    } else if (!isFocused) {
      onFocus?.(event);
      setIsFocused(true);
    }
  };

  const onYearChange = (newYear) => {
    const yearWithinValidRange = getYearWithinValidRange(newYear, max, min);
    const monthWithinValidRange = getMonthWithinValidRange(month, yearWithinValidRange, max, min);
    const dayWithinValidRange = getDayWithinValidRange(day, monthWithinValidRange, yearWithinValidRange, max, min);

    onChange(`${yearWithinValidRange}-${monthWithinValidRange}-${dayWithinValidRange}`);
  };

  const onYearInputChange = (event) => {
    const newYear = event.target.value;
    if (isValidYearInput(newYear) || newYear === '') {
      onYearChange(newYear);
    }
  };

  const onYearInputKeyDown = (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();

      monthInputRef.current.focus();
    }
  };

  const onMonthChange = (newMonth) => {
    const monthWithinValidRange = getMonthWithinValidRange(newMonth, year, max, min);
    const dayWithinValidRange = getDayWithinValidRange(day, monthWithinValidRange, year, max, min);

    onChange(`${year}-${monthWithinValidRange}-${dayWithinValidRange}`);
  };

  const onMonthInputChange = (event) => {
    const newMonth = event.target.value;
    if (!isSecondMonthDigitPossible(newMonth)) {
      // Autofill the first digit when the user enters a number that can't have a digit after it to be a valid month.
      onMonthChange(`0${newMonth}`);
    } else if (isValidMonthInput(newMonth) || newMonth === '') {
      onMonthChange(newMonth);
    }
  };

  const onMonthInputKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();

      yearInputRef.current.focus();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();

      dayInputRef.current.focus();
    }
  };

  const onDayChange = (newDay) => {
    const dayWithinValidRange = getDayWithinValidRange(newDay, month, year, max, min);

    onChange(`${year}-${month}-${dayWithinValidRange}`);
  };

  const onDayInputChange = (event) => {
    const newDay = event.target.value;
    if (!isSecondDayDigitPossible(newDay)) {
      // Autofill the first digit when the user enters a number that can't have a digit after it to be a valid day.
      onDayChange(`0${newDay}`);
    } else if (isValidDayInput(newDay) || newDay === '') {
      onDayChange(newDay);
    }
  };

  const onDayInputKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();

      monthInputRef.current.focus();
    }
  };

  useEffect(() => {
    if (document.activeElement === yearInputRef.current && isYearInputComplete(year)) {
      monthInputRef.current.focus();
    }
  }, [year]);

  useEffect(() => {
    if (document.activeElement === monthInputRef.current && isMonthInputComplete(month)) {
      dayInputRef.current.focus();
    }
  }, [month]);

  return <div
      className={`${styles.datePicker} ${disabled ? styles.disabled : ''} ${className}`}
      onBlur={onWrapperBlur}
      onFocus={onWrapperFocus}
      ref={innerRef}
      role="group"
      tabIndex={disabled ? -1 : 0}
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
      onBlur={() => shouldCompleteFirstMonthDigitWithZero(month) && onMonthChange(`0${month}`)}
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
      onBlur={() => shouldCompleteFirstDayDigitWithZero(day) && onDayChange(`0${day}`)}
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
      dateFormat="yyyy/MM/dd"
      disabled={disabled}
      isOpen={isCalendarOpen}
      maxDate={max ? parseISO(max) : undefined}
      minDate={min ? parseISO(min) : undefined}
      onChange={onChange}
      readOnly={readOnly}
      setIsOpen={setIsCalendarOpen}
      value={value}
      {...reactDatePickerProps}
    />

    <input name={name} type="hidden" value={value} />
  </div>;
};

export { EMPTY_DATE_VALUE };

export default memo(forwardRef(DatePicker));
