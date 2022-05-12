import React, { useState, forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import noop from 'lodash/noop';
import getMonth from 'date-fns/get_month';
import getYear from 'date-fns/get_year';

import { ReactComponent as CalendarIcon } from '../common/images/icons/calendar.svg';
import { ReactComponent as ArrowDown } from '../common/images/icons/arrow-down-small.svg';
import { ReactComponent as ArrowUp } from '../common/images/icons/arrow-up-small.svg';
import { ReactComponent as ChevronLeft } from '../common/images/icons/chevron-left.svg';
import { ReactComponent as ChevronRight } from '../common/images/icons/chevron-right.svg';

import 'react-datepicker/dist/react-datepicker.css';
import styles from './styles.module.scss';

// Documentation
// https://reactdatepicker.com/#example-custom-input

const StyledDatePicker = ({ value,
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
      showPopperArrow={false}
      timeInputLabel="Time:"
      onCalendarOpen={handleOpen}
      onCalendarClose={handleClose}
      customInput={ !disableCustomInput ?
      customInput || <CustomDefaultInput
      value={value}
      onClick={onChange}
      className={className}
      placeholderText={placeholderText}
      isPopperOpen={isOpen}
      /> : null}
      showMonthDropdown
      showYearDropdown
      renderCustomHeader={({
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
          <button onClick={decreaseYear}> <ChevronLeft/><ChevronLeft/> </button>
          <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled}> <ChevronLeft/> </button>

          <DatePicker
            selected={date}
            dateFormat="yyyy"
            showMonthYearPicker
            onChange={(date) => { changeMonth(getMonth(date)); changeYear(getYear(date)); }}
            customInput={<button className={styles.headerTitle} onClick={increaseMonth}> {`${date.toLocaleString('en-US', { month: 'short' })} ${getYear(date)}`} </button>}
          />

          <button onClick={increaseMonth} disabled={nextMonthButtonDisabled}> <ChevronRight/> </button>
          <button onClick={increaseYear}> <ChevronRight/><ChevronRight/> </button>
        </div>
      )}
      {...rest}
      >
      {children}
    </DatePicker>
  </>;

};

// eslint-disable-next-line react/display-name
const CustomDefaultInput = forwardRef(({
  value,
  onClick,
  isPopperOpen = false,
  placeholderText = null,
  className = null
}, ref) => {

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
      ref={ref}
      >
      <CalendarIcon/>
      <span className={!value && placeholderText ? 'placeholder' : ''}>{value || placeholderText}</span>
      {isPopperOpen ? <ArrowUp /> : <ArrowDown />}
    </button>
  </>;
});


export default forwardRef(StyledDatePicker);