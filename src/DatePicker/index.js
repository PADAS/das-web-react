import React, { forwardRef, memo, useCallback, useState } from 'react';
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
  const CustomInput = <div className={styles.headerTitle}>
    {`${date.toLocaleString('en-US', { month: 'short' })} ${getYear(date)}`}

    <div className={styles.triangle} />
  </div>;

  const onChangeDate = (date) => {
    changeMonth(getMonth(date));
    changeYear(getYear(date));
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
      customInput={CustomInput}
      dateFormat="yyyy"
      onChange={onChangeDate}
      popperPlacement="bottom"
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

const CustomInput = ({ className, isPopperOpen, placeholderText, value, ...rest }, ref) => <div
    className={styles.inputWrapper}
  >
  <CalendarIcon/>

  <input
    className={`${styles.input} ${className}`}
    data-testid="datePicker-input"
    ref={ref}
    type="text"
    value={value || placeholderText}
    {...rest}
  />

  <div className={`${styles.triangle} ${isPopperOpen ? styles.open : ''}`} />
</div>;

CustomInput.defaultProps = {
  className: '',
  placeholderText: '',
  value: '',
};

CustomInput.propTypes = {
  className: PropTypes.string,
  isPopperOpen: PropTypes.bool.isRequired,
  placeholderText: PropTypes.string,
  value: PropTypes.string,
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
    customInput={<CustomInputWithRef isPopperOpen={isOpen} placeholderText={placeholderText || DEFAULT_PLACEHOLDER} />}
    onCalendarClose={handleCalendarClose}
    onCalendarOpen={handleCalendarOpen}
    ref={ref}
    renderCustomHeader={CustomHeader}
    showPopperArrow={false}
    timeInputLabel="Time:"
    {...rest}
  />;
};

CustomDatePicker.defaultProps = {
  onCalendarClose: null,
  onCalendarOpen: null,
  placeholderText: '',
};

CustomDatePicker.propTypes = {
  onCalendarClose: PropTypes.func,
  onCalendarOpen: PropTypes.func,
  placeholderText: PropTypes.string,
};

export default memo(forwardRef(CustomDatePicker));