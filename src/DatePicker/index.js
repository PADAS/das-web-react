import React, { useState, forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import noop from 'lodash/noop';
import getMonth from 'date-fns/get_month';
import getYear from 'date-fns/get_year';

import { ReactComponent as CalendarIcon } from '../common/images/icons/calendar.svg';
import { ReactComponent as ChevronLeft } from '../common/images/icons/chevron-left.svg';
import { ReactComponent as ChevronRight } from '../common/images/icons/chevron-right.svg';

import 'react-datepicker/dist/react-datepicker.css';
import styles from './styles.module.scss';

// Date picker documentation
// https://reactdatepicker.com

const CustomDatePicker = ({ value,
  onChange,
  disableCustomInput,
  customInput = null,
  children = null,
  className,
  placeholderText = 'select a date',
  onCalendarOpen = noop,
  onCalendarClose = noop,
  innerRef,
  ...rest }) => {

  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    onCalendarOpen();
  };

  const handleClose = () => {
    setIsOpen(false);
    onCalendarClose();
  };

  return <>
    <DatePicker
      ref={innerRef}
      selected={value}
      onChange={onChange}
      className={className}
      showPopperArrow={false}
      timeInputLabel="Time:"
      onCalendarOpen={handleOpen}
      onCalendarClose={handleClose}
      customInput={
        !disableCustomInput ? customInput || <CustomDefaultInput
        value={value}
        onClick={onChange}
        className={className}
        placeholderText={placeholderText}
        isPopperOpen={isOpen}
        /> : null
      }
      renderCustomHeader={CustomHeader}
      {...rest}
      >
      {children}
    </DatePicker>
  </>;
};

const CustomHeader = ({
  date,
  changeYear,
  changeMonth,
  decreaseYear,
  increaseYear,
  decreaseMonth,
  increaseMonth,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled,
}) => (
  <div className={styles.customHeader}>
    <button onClick={(e) => {e.preventDefault(); decreaseYear();}}> <ChevronLeft/><ChevronLeft/> </button>
    <button onClick={(e) => {e.preventDefault(); decreaseMonth();}} disabled={prevMonthButtonDisabled}> <ChevronLeft/> </button>

    <DatePicker
      selected={date}
      dateFormat="yyyy"
      showMonthYearPicker
      onChange={(date) => { changeMonth(getMonth(date)); changeYear(getYear(date)); }}
      customInput={<div className={styles.headerTitle}>
        {`${date.toLocaleString('en-US', { month: 'short' })} ${getYear(date)}`}
        <div className={styles.triangle}></div>
      </div>}
    />

    <button onClick={(e) => {e.preventDefault(); increaseMonth();}} disabled={nextMonthButtonDisabled}> <ChevronRight/> </button>
    <button onClick={(e) => {e.preventDefault(); increaseYear();}}> <ChevronRight/><ChevronRight/> </button>
  </div>
);

const CustomDefaultInput = ({ value, onClick, isPopperOpen, placeholderText = null, className = null }) => {

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return <>
    <button
      className={`${styles.datePickerCustomInput} ${className}`}
      data-testid="custom-datepicker-button"
      onClick={handleClick}
      >
      <CalendarIcon/>
      <span className={!value && placeholderText ? styles.placeholder : ''}>{value || placeholderText}</span>
      <div className={`${styles.triangle} ${isPopperOpen? 'open' : ''}`}></div>
    </button>
  </>;
};

export default forwardRef(CustomDatePicker);