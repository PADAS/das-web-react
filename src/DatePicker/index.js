import React, { useState, forwardRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';

import { ReactComponent as DefaultCalendarIcon } from '../common/images/icons/calendar.svg';
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
  calendarIcon,
  placeholderText = 'select a date',
  ...rest }) => {

  const [isOpen, setIsOpen] = useState(false);

  return <>
    <DatePicker
      selected={value}
      onChange={onChange}
      showPopperArrow={false}
      timeInputLabel="Time:"
      onCalendarOpen={() => setIsOpen(true)}
      onCalendarClose={() => setIsOpen(false)}
      customInput={ !disableCustomInput ?
        customInput || <CustomDefaultInput
          value={value}
          onClick={onChange}
          calendarIcon={calendarIcon}
          className={className}
          placeholderText={placeholderText}
          isPopperOpen={isOpen}
        /> : null}
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
  calendarIcon = null,
  placeholderText = null,
  className = null
}, ref) => {

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return <>
    <button className={`${styles.datePickerCustomInput} ${className}`} onClick={handleClick} ref={ref}>
      {calendarIcon || <DefaultCalendarIcon />}
      <span className={!value && placeholderText ? 'placeholder' : ''}>{value || placeholderText}</span>
      {isPopperOpen ? <ArrowUp /> : <ArrowDown />}
    </button>
  </>;
});

export default forwardRef(StyledDatePicker);