import React, { forwardRef, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import { getMonth, getYear } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ChevronLeft } from '../../../common/images/icons/chevron-left.svg';
import { ReactComponent as ChevronRight } from '../../../common/images/icons/chevron-right.svg';

import { getCurrentLocale } from '../../../utils/datetime';

import * as styles from './styles.module.scss';

// eslint-disable-next-line react/display-name
const Input = forwardRef(({
  className,
  date,
  isMonthCalendarOpen,
  onClick,
  // We ignore the react-datepicker internals for the keydown event and just handle the Escape ourselves.
  onKeyDown: _onKeyDown,
  setIsMonthCalendarOpen,
  ...otherProps
}, ref) => {
  const { i18n, t } = useTranslation('components', { keyPrefix: 'datePicker.calendarPopper.monthPicker' });

  const onButtonClick = (event) => {
    setIsMonthCalendarOpen(!isMonthCalendarOpen);
    onClick(event);
  };

  const onButtonKeyDown = (event) => {
    if (event.key === 'Escape' && isMonthCalendarOpen) {
      event.stopPropagation();

      setIsMonthCalendarOpen(false);
    }
  };

  return <button
      aria-expanded={isMonthCalendarOpen}
      aria-haspopup="dialog"
      aria-label={t('inputButtonLabel')}
      className={`${styles.inputButton} ${className}`}
      onClick={onButtonClick}
      onKeyDown={onButtonKeyDown}
      ref={ref}
      type="button"
      {...otherProps}
      title={t('inputButtonLabel')}
    >
    {`${date.toLocaleString(i18n.language, { month: 'short' })} ${getYear(date)}`}

    <div className={`${styles.caret} ${isMonthCalendarOpen ? styles.open : ''}`} role="img" />
  </button>;
});

const Header = ({
  date,
  decreaseYear,
  increaseYear,
  nextYearButtonDisabled,
  onKeyDown,
  prevYearButtonDisabled,
}) => {
  const { t } = useTranslation('components', { keyPrefix: 'datePicker.calendarPopper.monthPicker' });

  return <div
      className={styles.header}
      data-testid="datePicker-calendarPopper-monthPicker-header"
      onKeyDown={onKeyDown}
    >
    <button
      aria-label={t('previousYearButtonLabel')}
      className={styles.chevronButton}
      disabled={prevYearButtonDisabled}
      onClick={decreaseYear}
      title={t('previousYearButtonLabel')}
      type="button"
    >
      <ChevronLeft />
    </button>

    <p className={`${styles.year}`}>{getYear(date)}</p>

    <button
      aria-label={t('nextYearButtonLabel')}
      className={styles.chevronButton}
      disabled={nextYearButtonDisabled}
      onClick={increaseYear}
      title={t('nextYearButtonLabel')}
      type="button"
    >
      <ChevronRight />
    </button>
  </div>;
};

// eslint-disable-next-line react/display-name
const getRenderCustomHeader = (onDatePickerKeyDown) => ({
  date,
  decreaseYear,
  increaseYear,
  nextYearButtonDisabled,
  prevYearButtonDisabled,
}) => <Header
  date={date}
  decreaseYear={decreaseYear}
  increaseYear={increaseYear}
  nextYearButtonDisabled={nextYearButtonDisabled}
  onKeyDown={onDatePickerKeyDown}
  prevYearButtonDisabled={prevYearButtonDisabled}
/>;

const MonthPicker = ({
  changeMonth,
  changeYear,
  date,
  decreaseMonth,
  decreaseYear,
  increaseMonth,
  increaseYear,
  maxDate,
  minDate,
  nextMonthButtonDisabled,
  nextYearButtonDisabled,
  onKeyDown,
  prevMonthButtonDisabled,
  prevYearButtonDisabled,
}) => {
  const { i18n, t } = useTranslation('components', { keyPrefix: 'datePicker.calendarPopper.monthPicker' });

  const innerRef = useRef();

  const [isMonthCalendarOpen, setIsMonthCalendarOpen] = useState(false);

  const dateLocale = getCurrentLocale(i18n.language);

  const onChange = (date) => {
    changeMonth(getMonth(date));
    changeYear(getYear(date));
    setIsMonthCalendarOpen(false);
  };

  const onDatePickerKeyDown = (event) => {
    if (event.key === 'Escape' && isMonthCalendarOpen) {
      event.stopPropagation();

      setIsMonthCalendarOpen(false);
    }
  };

  // We remove the onKeyDown callback if the month calendar is open so the Escape key down event closes the month
  // calendar but not the parent calendar.
  return <div className={styles.monthPicker} onKeyDown={isMonthCalendarOpen ? undefined : onKeyDown}>
    <button
      aria-label={t('previousYearButtonLabel')}
      className={styles.chevronButton}
      disabled={prevYearButtonDisabled}
      onClick={decreaseYear}
      title={t('previousYearButtonLabel')}
      type="button"
    >
      <ChevronLeft />
      <ChevronLeft />
    </button>

    <button
      aria-label={t('previousMonthButtonLabel')}
      className={styles.chevronButton}
      disabled={prevMonthButtonDisabled}
      onClick={decreaseMonth}
      title={t('previousMonthButtonLabel')}
      type="button"
    >
      <ChevronLeft />
    </button>

    <DatePicker
      calendarClassName={styles.calendar}
      customInput={<Input
        date={date}
        isMonthCalendarOpen={isMonthCalendarOpen}
        setIsMonthCalendarOpen={setIsMonthCalendarOpen}
      />}
      dateFormat="yyyy"
      locale={dateLocale}
      maxDate={maxDate}
      minDate={minDate}
      onChange={onChange}
      // If there is a click outside of the month calendar that is not in the date picker input, we close it.
      onClickOutside={(event) => !innerRef.current.input.contains(event.target) && setIsMonthCalendarOpen(false)}
      onKeyDown={onDatePickerKeyDown}
      open={isMonthCalendarOpen}
      popperPlacement="bottom"
      ref={innerRef}
      renderCustomHeader={getRenderCustomHeader(onDatePickerKeyDown)}
      selected={date}
      showMonthYearPicker
      showPopperArrow={false}
    />

    <button
      aria-label={t('nextMonthButtonLabel')}
      className={styles.chevronButton}
      disabled={nextMonthButtonDisabled}
      onClick={increaseMonth}
      title={t('nextMonthButtonLabel')}
      type="button"
    >
      <ChevronRight />
    </button>

    <button
      aria-label={t('nextYearButtonLabel')}
      className={styles.chevronButton}
      disabled={nextYearButtonDisabled}
      onClick={increaseYear}
      title={t('nextYearButtonLabel')}
      type="button"
    >
      <ChevronRight />
      <ChevronRight />
    </button>
  </div>;
};

export default MonthPicker;
