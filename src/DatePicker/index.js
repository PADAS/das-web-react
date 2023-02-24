import React, { createRef, forwardRef, memo, useCallback, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import getMonth from 'date-fns/get_month';
import getYear from 'date-fns/get_year';
import PropTypes from 'prop-types';

import { ReactComponent as CalendarIcon } from '../common/images/icons/calendar.svg';
import { ReactComponent as ChevronLeft } from '../common/images/icons/chevron-left.svg';
import { ReactComponent as ChevronRight } from '../common/images/icons/chevron-right.svg';

import 'react-datepicker/dist/react-datepicker.css';
import styles from './styles.module.scss';

const DEFAULT_DATE_FORMAT = 'dd/MM/yyyy';
const DEFAULT_TIME_INPUT_LABEL = 'Time:';

const CustomHeader = ({
  changeMonth,
  changeYear,
  date,
  decreaseMonth,
  decreaseYear,
  increaseMonth,
  increaseYear,
  nextMonthButtonDisabled,
  prevMonthButtonDisabled,
}) => {
  const monthYearPickerRef = createRef();

  const CustomMonthYearPickerHeader = ({ date, decreaseYear, increaseYear }) => <div className={styles.header}>
    <button type='button' onClick={decreaseYear}>
      <ChevronLeft/>
    </button>

    <div className={`${styles.headerTitle} ${styles.customMonthYearPickerHeaderTitle}`}>
      {getYear(date)}
    </div>

    <button type='button' onClick={increaseYear}>
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
    <button type='button' data-testid="datePicker-decreaseYear" onClick={decreaseYear}>
      <ChevronLeft/>
      <ChevronLeft/>
    </button>

    <button type='button' data-testid="datePicker-decreaseMonth" disabled={prevMonthButtonDisabled} onClick={decreaseMonth}>
      <ChevronLeft/>
    </button>

    <DatePicker
      customInput={CustomMonthYearPickerInput}
      dateFormat="yyyy"
      onChange={onChangeDate}
      onInputClick={onInputClick}
      popperPlacement="bottom"
      ref={monthYearPickerRef}
      renderCustomHeader={CustomMonthYearPickerHeader}
      selected={date}
      showMonthYearPicker
      showPopperArrow={false}
    />

    <button type='button' data-testid="datePicker-increaseMonth" disabled={nextMonthButtonDisabled} onClick={increaseMonth}>
      <ChevronRight/>
    </button>

    <button type='button' data-testid="datePicker-increaseYear" onClick={increaseYear}>
      <ChevronRight/>
      <ChevronRight/>
    </button>
  </div>;
};


const CustomInput = ({ className, disabled, isPopperOpen, onChange, onKeyDown, onPaste, ...rest }, ref) => {
  const inputRef = useRef();
  const pressedKeyRef = useRef();
  const wasPastedRef = useRef(false);

  const handleChange = useCallback((event) => {
    let newValue = event.target.value.replaceAll('-', '/');

    const wasNewValuePasted = wasPastedRef.current;
    const userPressedBackspace = pressedKeyRef.current === 'Backspace';

    const newValueContainsValidMonthText = newValue.length === 2 && !newValue.includes('/');
    const newValueContainsValidMonthAndDayText = /^[0-9]{2}\/[0-9]{2}$/.test(newValue);
    if (!userPressedBackspace && (newValueContainsValidMonthText || newValueContainsValidMonthAndDayText)) {
      newValue = `${newValue}/`;
    }

    const newValueHasValidCharacters = /^[/0-9]*$/.test(newValue);
    if (newValueHasValidCharacters) {
      const newValueHasOnlyNumbers = /^[0-9]*$/.test(newValue);
      if (wasNewValuePasted && newValueHasOnlyNumbers && newValue.length > 4) {
        newValue =`${newValue.substring(0, 2)}/${newValue.substring(2, 4)}/${newValue.substring(4)}`;
      }

      event.target.value = newValue;
      onChange(event);
    }

    pressedKeyRef.current = undefined;
    wasPastedRef.current = false;
  }, [onChange]);

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
      onChange={handleChange}
      onPaste={handlePaste}
      ref={inputRef}
      type="text"
      {...rest}
    />

    <div className={`${styles.triangle} ${isPopperOpen ? styles.open : ''}`} />
  </div>;
};

const CustomInputWithRef = forwardRef(CustomInput);


const CustomDatePicker = ({ dateFormat, onCalendarClose, onCalendarOpen, placeholderText, ...rest }, ref) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCalendarOpen = useCallback(() => {
    setIsOpen(true);
    onCalendarOpen?.();
  }, [onCalendarOpen]);

  const handleCalendarClose = useCallback(() => {
    setIsOpen(false);
    onCalendarClose?.();
  }, [onCalendarClose]);

  return <DatePicker
    customInput={<CustomInputWithRef isPopperOpen={isOpen} />}
    dateFormat={dateFormat || DEFAULT_DATE_FORMAT}
    onCalendarClose={handleCalendarClose}
    onCalendarOpen={handleCalendarOpen}
    placeholderText={placeholderText || (dateFormat || DEFAULT_DATE_FORMAT).toUpperCase()}
    ref={ref}
    renderCustomHeader={CustomHeader}
    showPopperArrow={false}
    timeInputLabel={DEFAULT_TIME_INPUT_LABEL}
    {...rest}
  />;
};

CustomDatePicker.defaultProps = {
  onCalendarClose: null,
  onCalendarOpen: null,
  placeholderText: null,
};

CustomDatePicker.propTypes = {
  onCalendarClose: PropTypes.func,
  onCalendarOpen: PropTypes.func,
  placeholderText: PropTypes.string,
};

export default memo(forwardRef(CustomDatePicker));
