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

const DEFAULT_PLACEHOLDER = 'Select a date';

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
    <button onClick={decreaseYear}>
      <ChevronLeft/>
    </button>

    <div className={`${styles.headerTitle} ${styles.customMonthYearPickerHeaderTitle}`}>
      {getYear(date)}
    </div>

    <button onClick={increaseYear}>
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
    <button data-testid="datePicker-decreaseYear" onClick={decreaseYear}>
      <ChevronLeft/>
      <ChevronLeft/>
    </button>

    <button data-testid="datePicker-decreaseMonth" disabled={prevMonthButtonDisabled} onClick={decreaseMonth}>
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

    <button data-testid="datePicker-increaseMonth" disabled={nextMonthButtonDisabled} onClick={increaseMonth}>
      <ChevronRight/>
    </button>

    <button data-testid="datePicker-increaseYear" onClick={increaseYear}>
      <ChevronRight/>
      <ChevronRight/>
    </button>
  </div>;
};


const CustomInput = ({ className, isPopperOpen, onChange, onKeyDown, ...rest }, ref) => {
  const pressedKeyRef = useRef();

  const handleKeyDown = useCallback((event) => {
    pressedKeyRef.current = event.key;

    onKeyDown(event);
  }, [onKeyDown]);

  const handleChange = useCallback((event) => {
    let newValue = event.target.value;

    const userPressedBackspace = pressedKeyRef.current === 'Backspace';
    const newValueContainsValidMonthText = newValue.length === 2 && !newValue.includes('/');
    const newValueContainsValidMonthAndDayText = /^[0-9]{2}\/[0-9]{2}$/.test(newValue);
    if (!userPressedBackspace && (newValueContainsValidMonthText || newValueContainsValidMonthAndDayText)) {
      event.target.value = `${newValue}/`;
    }

    const newValueHasValidCharacters = /^[/0-9]*$/.test(newValue);
    if (newValueHasValidCharacters) {
      onChange(event);
    }
  }, [onChange]);

  return <div className={styles.inputWrapper}>
    <CalendarIcon/>

    <input
      className={`${styles.input} ${className}`}
      data-testid="datePicker-input"
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      ref={ref}
      type="text"
      {...rest}
    />

    <div className={`${styles.triangle} ${isPopperOpen ? styles.open : ''}`} />
  </div>;
};

const CustomInputWithRef = forwardRef(CustomInput);


const CustomDatePicker = ({ onCalendarClose, onCalendarOpen, placeholderText, ...rest }, ref) => {
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
    onCalendarClose={handleCalendarClose}
    onCalendarOpen={handleCalendarOpen}
    ref={ref}
    renderCustomHeader={CustomHeader}
    showPopperArrow={false}
    placeholderText={placeholderText || DEFAULT_PLACEHOLDER}
    timeInputLabel="Time:"
    {...rest}
  />;
};

CustomDatePicker.defaultProps = {
  onCalendarClose: null,
  onCalendarOpen: null,
  placeholderText: DEFAULT_PLACEHOLDER,
};

CustomDatePicker.propTypes = {
  onCalendarClose: PropTypes.func,
  onCalendarOpen: PropTypes.func,
  placeholderText: PropTypes.string,
};

export default memo(forwardRef(CustomDatePicker));
