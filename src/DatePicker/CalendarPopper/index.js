import React, { forwardRef, useMemo, useRef } from 'react';
import DatePicker from 'react-datepicker';
import { useTranslation } from 'react-i18next';

import { getCurrentLocale } from '../../utils/datetime';
import { isValidDate } from '../utils';

import MonthPicker from './MonthPicker';

import 'react-datepicker/dist/react-datepicker.css';
import styles from './styles.module.scss';

// eslint-disable-next-line react/display-name
const Input = forwardRef(({
  className,
  isOpen,
  onClick,
  // We ignore the react-datepicker internals for the keydown event and just handle the Escape ourselves.
  onKeyDown: _onKeyDown,
  setIsOpen,
  ...otherProps
}, ref) => {
  const { t } = useTranslation('components', { keyPrefix: 'datePicker.calendarPopper' });

  const onButtonClick = (event) => {
    setIsOpen(!isOpen);
    onClick(event);
  };

  const onButtonKeyDown = (event) => {
    if (event.key === 'Escape' && isOpen) {
      event.stopPropagation();

      setIsOpen(false);
    }
  };

  return <button
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      aria-label={t('menuButtonLabel')}
      className={`${styles.menuButton} ${className}`}
      onClick={onButtonClick}
      onKeyDown={onButtonKeyDown}
      ref={ref}
      type="button"
      {...otherProps}
    >
    <div className={`${styles.caret} ${isOpen ? styles.open : ''}`} role="img" />
  </button>;
});

// eslint-disable-next-line react/display-name
const getRenderCustomHeader = (maxDate, minDate, onKeyDown) => ({
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
}) => <MonthPicker
  changeMonth={changeMonth}
  changeYear={changeYear}
  date={date}
  decreaseMonth={decreaseMonth}
  decreaseYear={decreaseYear}
  increaseMonth={increaseMonth}
  increaseYear={increaseYear}
  maxDate={maxDate}
  minDate={minDate}
  nextMonthButtonDisabled={nextMonthButtonDisabled}
  nextYearButtonDisabled={nextYearButtonDisabled}
  onKeyDown={onKeyDown}
  prevMonthButtonDisabled={prevMonthButtonDisabled}
  prevYearButtonDisabled={prevYearButtonDisabled}
/>;

const CalendarPopper = ({
  dateFormat = 'yyyy/MM/dd',
  disabled,
  isOpen,
  maxDate,
  minDate,
  onChange,
  readOnly,
  setIsOpen,
  value,
  ...otherProps
}) => {
  const { i18n } = useTranslation('components', { keyPrefix: 'datePicker.calendarPopper' });

  const innerRef = useRef();

  const dateLocale = getCurrentLocale(i18n.language);

  // We handle the value as a string with the yyyy-MM-dd format, but react-datepicker expects a date object so we build
  // it here.
  const selected = useMemo(() => {
    if (isValidDate(value)) {
      const [year, month, day] = value.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return undefined;
  }, [value]);

  // When the user picks a date, we convert back the date object provided by react-datepicker to a string.
  const onDatePickerChange = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    onChange(`${year}-${month}-${day}`);

    setIsOpen(false);
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape' && isOpen) {
      event.stopPropagation();

      setIsOpen(false);
    }
  };

  return <DatePicker
    calendarClassName={styles.calendar}
    customInput={<Input isOpen={isOpen} setIsOpen={setIsOpen} />}
    dateFormat={dateFormat}
    dayClassName={() => styles.day}
    disabled={disabled || readOnly}
    locale={dateLocale}
    maxDate={maxDate}
    minDate={minDate}
    onChange={onDatePickerChange}
    // If there is a click outside of the calendar that is not in the date picker input, we close it.
    onClickOutside={(event) => !innerRef.current.input.contains(event.target) && setIsOpen(false)}
    onKeyDown={onKeyDown}
    open={isOpen}
    popperClassName={styles.popper}
    popperPlacement="bottom"
    ref={innerRef}
    renderCustomHeader={getRenderCustomHeader(maxDate, minDate, onKeyDown)}
    selected={selected}
    showPopperArrow={false}
    wrapperClassName={styles.wrapper}
    {...otherProps}
  />;
};

export default CalendarPopper;
