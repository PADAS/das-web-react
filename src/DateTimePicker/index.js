import React, { forwardRef, memo, useImperativeHandle, useRef } from 'react';

import { getMaxDateAndTime, getMinDateAndTime } from './utils';

import DatePicker, { EMPTY_DATE_VALUE } from '../DatePicker';
import TimePicker, { EMPTY_TIME_VALUE } from '../TimePicker';

import * as styles from './styles.module.scss';

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

  // Value is expected to come as a string in format yyyy-MM-ddTHH:mm so we break it down to its parts.
  const [dateValue, timeValue] = value.split('T');
  const [hourValue = '', minuteValue = ''] = timeValue.split(':');

  const [maxDate, maxTime] = getMaxDateAndTime(max, value);
  const [minDate, minTime] = getMinDateAndTime(min, value);

  return <div
      className={`${styles.dateTimePicker} ${className}`}
      // Since our picker is a group of inputs, we handle the blur and focus from the wrapper but make sure to not call
      // the methods if we are just changing focus within the inner inputs.
      onBlur={(event) => !innerRef.current.contains(event.relatedTarget) && onBlur?.(event)}
      onFocus={(event) => !innerRef.current.contains(event.relatedTarget) && onFocus?.(event)}
      ref={innerRef}
      role="group"
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

    <input data-testid="dateTimePicker-input" name={name} type="hidden" value={value} />
  </div>;
};

export default memo(forwardRef(DateTimePicker));
