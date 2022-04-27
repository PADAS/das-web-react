import React, { useState, forwardRef } from 'react';
import DatePicker from 'react-datepicker';

import { ReactComponent as DefaultCalendarIcon } from '../common/images/icons/calendar.svg';
import { ReactComponent as ArrowDown } from '../common/images/icons/arrow-down-small.svg';
import { ReactComponent as ArrowUp } from '../common/images/icons/arrow-up-small.svg';

import 'react-datepicker/dist/react-datepicker.css';
import styles from './styles.module.scss';

const StyledDatePicker = ({ value, onChange, customInput = null, children = null, className, calendarIcon, placeholderText, ...rest }) => {

  return <>
    <DatePicker
      selected={value}
      onChange={onChange}
      showPopperArrow={false}
      timeInputLabel="Time:"
      customInput={
        customInput || <CustomDefaultInput
        value={value}
        onClick={onChange}
        calendarIcon={calendarIcon}
        className={className}
        placeholderText={placeholderText}
      />}
      {...rest}
      >
      {children}
    </DatePicker>
  </>;

};

// eslint-disable-next-line react/display-name
const CustomDefaultInput = forwardRef(({ value, onClick, calendarIcon = null, placeholderText = null,  className = null }, ref) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
    onClick();
  };

  return <>
    <button className={`${styles.datePickerCustomInput} ${className}`} onClick={handleClick} ref={ref}>
      {calendarIcon || <DefaultCalendarIcon />}
      <span className={placeholderText ? 'placeholder' : ''}>{value || placeholderText}</span>
      {isOpen ? <ArrowUp /> : <ArrowDown />}
    </button>
  </>;
});

export default forwardRef(StyledDatePicker);