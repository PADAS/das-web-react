import React, { useState, forwardRef } from 'react';
import DatePicker from 'react-datepicker';

import { ReactComponent as CalendarIcon } from '../common/images/icons/calendar.svg';
import { ReactComponent as ArrowDown } from '../common/images/icons/arrow-down-small.svg';
import { ReactComponent as ArrowUp } from '../common/images/icons/arrow-up-small.svg';

import 'react-datepicker/dist/react-datepicker.css';
import styles from './styles.module.scss';

const StyledDatePicker = ({ value, onChange, ...rest }) => {

  return <>
    <DatePicker
      isClearable
      selected={value}
      onChange={onChange}
      showPopperArrow={false}
      customInput={<CustomInput value={value} onClick={onChange}/>}
      {...rest}
    />
  </>;

};

// eslint-disable-next-line react/display-name
const CustomInput = forwardRef(({ value, onClick }, ref) => {
  const [isOpen, setIsOpen] = useState(new Date());

  const handleClick = (e) => {
    e.preventDefault();
    setIsOpen(!isOpen);
    onClick();
  };

  return <>
    <button className={styles.datePickerCustomInput} onClick={handleClick} ref={ref}>
      <CalendarIcon />
      <span>{value}</span>
      {isOpen ? <ArrowUp /> : <ArrowDown />}
    </button>
  </>;
});

export default forwardRef(StyledDatePicker);