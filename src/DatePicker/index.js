import React, { useState, forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import noop from 'lodash/noop';

import { ReactComponent as CalendarIcon } from '../common/images/icons/calendar.svg';
import { ReactComponent as ArrowDown } from '../common/images/icons/arrow-down-small.svg';
import { ReactComponent as ArrowUp } from '../common/images/icons/arrow-up-small.svg';

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