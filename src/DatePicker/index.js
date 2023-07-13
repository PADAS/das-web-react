import React, { createRef, forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import getMonth from 'date-fns/get_month';
import getYear from 'date-fns/get_year';
import PropTypes from 'prop-types';

import { ReactComponent as CalendarIcon } from '../common/images/icons/calendar.svg';
import { ReactComponent as ChevronLeft } from '../common/images/icons/chevron-left.svg';
import { ReactComponent as ChevronRight } from '../common/images/icons/chevron-right.svg';

import 'react-datepicker/dist/react-datepicker.css';
import styles from './styles.module.scss';

const DEFAULT_TIME_INPUT_LABEL = 'Time:';

const CustomTimePicker = (({ value: initialValue, onChange: notifyTimeChange }) => {
  const [time, setTime] = useState(initialValue);

  useEffect(() => {
    setTime(initialValue);
  }, [initialValue]);

  const onTimeChange = useCallback(({ target: { value } }) => {
    setTime(value);
    notifyTimeChange(value);
  }, [notifyTimeChange]);

  return <input value={time} onChange={onTimeChange} type='time' />;
});

CustomTimePicker.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

const renderCustomHeader = (maxDate, minDate) => {
  const CustomHeader = ({
    changeMonth,
    changeYear,
    date,
    decreaseMonth,
    decreaseYear,
    increaseMonth,
    increaseYear,
    nextMonthButtonDisabled,
    nextYearButtonDisabled,
    prevMonthButtonDisabled,
    prevYearButtonDisabled,
  }) => {
    const monthYearPickerRef = createRef();

    const CustomMonthYearPickerHeader = ({
      date,
      decreaseYear,
      increaseYear,
      nextYearButtonDisabled,
      prevYearButtonDisabled,
    }) => <div className={styles.header}>
      <button disabled={prevYearButtonDisabled} onClick={decreaseYear} type="button">
        <ChevronLeft/>
      </button>

      <div className={`${styles.headerTitle} ${styles.customMonthYearPickerHeaderTitle}`}>
        {getYear(date)}
      </div>

      <button disabled={nextYearButtonDisabled} onClick={increaseYear} type="button">
        <ChevronRight/>
      </button>
    </div>;

    const CustomMonthYearPickerInput = <div
        className={styles.headerTitle}
        data-testid="datePicker-monthYearPicker-input"
      >
      {`${date.toLocaleString('en-US', { month: 'short' })} ${getYear(date)}`}

      <div className={styles.triangle} />
    </div>;

    const onChangeDate = (date) => {
      changeMonth(getMonth(date));
      changeYear(getYear(date));
    };

    const onInputClick = () => {
      if (monthYearPickerRef.current.isCalendarOpen()) {
        monthYearPickerRef.current.setOpen(false);
      }
    };

    return <div className={styles.header}>
      <button
        type="button"
        data-testid="datePicker-decreaseYear"
        disabled={prevYearButtonDisabled}
        onClick={decreaseYear}
      >
        <ChevronLeft/>
        <ChevronLeft/>
      </button>

      <button
        type="button"
        data-testid="datePicker-decreaseMonth"
        disabled={prevMonthButtonDisabled}
        onClick={decreaseMonth}
      >
        <ChevronLeft/>
      </button>

      <DatePicker
        customInput={CustomMonthYearPickerInput}
        dateFormat="yyyy"
        maxDate={maxDate}
        minDate={minDate}
        onChange={onChangeDate}
        onInputClick={onInputClick}
        popperPlacement="bottom"
        ref={monthYearPickerRef}
        renderCustomHeader={CustomMonthYearPickerHeader}
        selected={date}
        showMonthYearPicker
        showPopperArrow={false}
      />

      <button
        data-testid="datePicker-increaseMonth"
        disabled={nextMonthButtonDisabled}
        onClick={increaseMonth}
        type="button"
      >
        <ChevronRight/>
      </button>

      <button
        data-testid="datePicker-increaseYear"
        disabled={nextYearButtonDisabled}
        onClick={increaseYear}
        type="button"
      >
        <ChevronRight/>
        <ChevronRight/>
      </button>
    </div>;
  };

  return CustomHeader;
};


const CustomInput = ({ className, disabled, isPopperOpen, onKeyDown, onPaste, onChange, dateFormat, ...rest }, ref) => {
  const inputRef = useRef();
  const pressedKeyRef = useRef();
  const wasPastedRef = useRef(false);


  const sanitizeInputValue = useCallback((value) => {
    const checkLetters = new RegExp('[A-Z]', 'ig');
    const checkInvalidChars = new RegExp('[@~`!#$%^&*ˆ()_=+\';\"\$?>.<,]', 'ig');
    return value ? value.replaceAll(checkInvalidChars, '').replaceAll(checkLetters, '').trim() : '';
  }, []);

  const handleChange = useCallback((event) => {
    const value = sanitizeInputValue(event.target.value);
    const userPressedBackspace = pressedKeyRef.current === 'Backspace';
    const formatIncludesHyphen = dateFormat.includes('-');
    const dateSeparator = formatIncludesHyphen ? '-' : '/';

    const checkYear = new RegExp('^[0-9]{4}$');
    const checkYearAndMonth = new RegExp(`^[0-9]{4}${dateSeparator}[0-9]{2}$`);
    const checkDate = new RegExp(`^[0-9]{4}${dateSeparator}[0-9]{2}${dateSeparator}[0-9]{2}$`);
    const wasNewValuePasted = wasPastedRef.current;

    let newValue = formatIncludesHyphen ? value.replaceAll('/', dateSeparator) : value.replaceAll(dateSeparator, '/');
    const newValueHasOnlyNumbers = /^[0-9]*$/.test(newValue);
    if (wasNewValuePasted && newValueHasOnlyNumbers && newValue.length > 6) {
      newValue =`${newValue.substring(0, 4)}${dateSeparator}${newValue.substring(4, 6)}${dateSeparator}${newValue.substring(6)}`;
    }

    const newValueContainsValidYearText = checkYear.test(newValue);
    const containsValidYearAndMonth = checkYearAndMonth.test(newValue);
    if (!userPressedBackspace && (newValueContainsValidYearText || containsValidYearAndMonth)) {
      newValue = `${newValue}${dateSeparator}`;
    }

    const containsValidDate = checkDate.test(newValue) && newValue.length === 10;
    if (containsValidDate){
      newValue = `${newValue} 00:00`;
    }

    event.target.value = newValue;
    onChange(event);

    pressedKeyRef.current = undefined;
    wasPastedRef.current = false;
  }, [dateFormat, onChange, sanitizeInputValue]);

  const handleKeyDown = useCallback((event) => {
    pressedKeyRef.current = event.key;

    onKeyDown?.(event);
  }, [onKeyDown]);

  const handlePaste = useCallback((event) => {
    wasPastedRef.current = true;

    onPaste?.(event);
  }, [onPaste]);

  const onWrapperClick = useCallback(() => inputRef.current.focus(), []);

  return <div
      className={`${styles.inputWrapper} ${disabled ? styles.disabled : ''} ${className}`}
      onClick={onWrapperClick}
      ref={ref}
    >
    <CalendarIcon/>

    <input
      className={styles.input}
      disabled={disabled}
      data-testid="datePicker-input"
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      ref={inputRef}
      type="text"
      onChange={handleChange}
      {...rest}
    />

    <div className={`${styles.triangle} ${isPopperOpen ? styles.open : ''}`} />
  </div>;
};

const CustomInputForwardRef = forwardRef(CustomInput);


const CustomDatePicker = ({ dateFormat, onCalendarClose, onCalendarOpen, placeholderText, showTimeInput, ...rest }, ref) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCalendarOpen = useCallback(() => {
    setIsOpen(true);
    onCalendarOpen?.();
  }, [onCalendarOpen]);

  const handleCalendarClose = useCallback(() => {
    setIsOpen(false);
    onCalendarClose?.();
  }, [onCalendarClose]);

  const CustomHeader = useMemo(() => renderCustomHeader(rest?.maxDate, rest?.minDate), [rest?.maxDate, rest?.minDate]);

  return <DatePicker
    customInput={<CustomInputForwardRef isPopperOpen={isOpen} dateFormat={dateFormat} />}
    dateFormat={dateFormat}
    onCalendarClose={handleCalendarClose}
    onCalendarOpen={handleCalendarOpen}
    placeholderText={placeholderText || (dateFormat).toUpperCase()}
    ref={ref}
    renderCustomHeader={CustomHeader}
    showPopperArrow={false}
    timeInputLabel={DEFAULT_TIME_INPUT_LABEL}
    showTimeInput={showTimeInput}
    customTimeInput={showTimeInput ? <CustomTimePicker/> : null}
    {...rest}
  />;
};

const CustomDatePickerForwardRef = forwardRef(CustomDatePicker);

CustomDatePickerForwardRef.defaultProps = {
  dateFormat: 'yyyy/MM/dd',
  onCalendarClose: null,
  onCalendarOpen: null,
  placeholderText: null,
};

CustomDatePickerForwardRef.propTypes = {
  dateFormat: PropTypes.string,
  onCalendarClose: PropTypes.func,
  onCalendarOpen: PropTypes.func,
  placeholderText: PropTypes.string,
};

export default memo(CustomDatePickerForwardRef);
