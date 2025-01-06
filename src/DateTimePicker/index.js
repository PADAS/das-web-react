import React, { forwardRef, memo, useImperativeHandle, useRef, useState } from 'react';

import DatePicker, { EMPTY_DATE_VALUE } from '../DatePicker';
import TimePicker, { EMPTY_TIME_VALUE } from '../TimePicker';

import styles from './styles.module.scss';

export const EMPTY_DATE_TIME_VALUE = `${EMPTY_DATE_VALUE}T${EMPTY_TIME_VALUE}`;

const DateTimePicker = ({
  className = '',
  datePickerProps = {},
  disabled = false,
  max = '',
  min = '',
  name = '',
  onBlur = null,
  onChange,
  onFocus = null,
  readOnly = false,
  required = false,
  timePickerProps = {},
  value,
  ...otherProps
}, ref) => {
  const datePickerRef = useRef();
  const innerRef = useRef();

  useImperativeHandle(ref, () => innerRef.current);

  const [isFocused, setIsFocused] = useState(false);

  // Value is expected to come as a string in format yyyy-MM-ddTHH:mm so we break it down to its parts.
  const [dateValue, timeValue] = value.split('T');
  const [hourValue = '', minuteValue = ''] = timeValue.split(':');

  const [maxDate, maxTimeWithOffset] = max.split('T');
  // We only apply a max time if there is a max date and the current value date matches it.
  let maxTime;
  if (maxDate && dateValue === maxDate) {
    const [maxHour = '', maxMinute = ''] = maxTimeWithOffset.split(':');
    maxTime = `${maxHour}:${maxMinute}`;
  }

  const [minDate, minTimeWithOffset] = min.split('T');
  // Same for min time.
  let minTime;
  if (minDate && dateValue === minDate) {
    const [minHour = '', minMinute = ''] = minTimeWithOffset.split(':');
    minTime = `${minHour}:${minMinute}`;
  }

  // Since our picker is a group of inputs, we handle the blurring from the wrapper but make sure to not call it when
  // changing focus within the inner inputs.
  const onWrapperBlur = (event) => {
    if (!innerRef.current.contains(event.relatedTarget)) {
      onBlur?.(event);
      setIsFocused(false);
    }
  };

  // Similarly, we handle the focus callback.
  const onWrapperFocus = (event) => {
    if (event.target === innerRef.current) {
      datePickerRef.current.focus();
    } else if (!isFocused) {
      onFocus?.(event);
      setIsFocused(true);
    }
  };

  return <div
      className={`${styles.dateTimePicker} ${className}`}
      onBlur={onWrapperBlur}
      onFocus={onWrapperFocus}
      ref={innerRef}
      role="group"
      tabIndex={disabled ? -1 : 0}
      {...otherProps}
    >
    <DatePicker
      disabled={disabled}
      max={maxDate}
      min={minDate}
      readOnly={readOnly}
      required={required}
      {...datePickerProps}
      className={`${styles.datePicker} ${datePickerProps.className || ''}`}
      onChange={(date) => onChange(`${date}T${timeValue === EMPTY_TIME_VALUE ? '00:00' : timeValue}`)}
      ref={datePickerRef}
      value={dateValue}
    />

    <TimePicker
      disabled={disabled}
      max={maxTime}
      min={minTime}
      readOnly={readOnly}
      required={required}
      {...timePickerProps}
      className={`${styles.timePicker} ${timePickerProps.className || ''}`}
      onChange={(time) => onChange(`${dateValue}T${time}`)}
      value={`${hourValue}:${minuteValue}`}
    />

    <input name={name} type="hidden" value={value} />
  </div>;
};

export default memo(forwardRef(DateTimePicker));
