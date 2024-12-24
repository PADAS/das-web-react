import React, { memo } from 'react';

import { DATE_TIME_ELEMENT_INPUT_TYPES } from '../../constants';
import { getTimezoneOffsetString } from '../../../../../utils/datetime';

import DatePicker, { EMPTY_DATE_VALUE } from '../../../../../DatePicker';
import DateTimePicker, { EMPTY_DATE_TIME_VALUE } from '../../../../../DateTimePicker';
import TimePicker, { EMPTY_TIME_VALUE } from '../../../../../TimePicker';

import styles from './styles.module.scss';

const DateInput = ({ onChange, value, ...otherProps }) => <DatePicker
  onChange={(newDate) => onChange(newDate === EMPTY_DATE_VALUE ? undefined : newDate)}
  value={value || EMPTY_DATE_VALUE}
  {...otherProps}
/>;

const DateTimeInput = ({ onChange, value, ...otherProps }) => {
  const [dateValue, timeValue] = (value || EMPTY_DATE_TIME_VALUE).split('T');

  const [hourValue = '', minuteValue = ''] = timeValue.split(':');
  const timeValueWithoutSecondsAndOffset = `${hourValue}:${minuteValue}`;

  const onDateTimePickerChange = (newDateTime) => {
    if (newDateTime === EMPTY_DATE_TIME_VALUE) {
      onChange(undefined);
    } else {
      // JSON schema time format expects the time with the timezone offset.
      const dateTimeWithSecondsAndOffset = `${newDateTime}:00${getTimezoneOffsetString()}`;
      onChange(dateTimeWithSecondsAndOffset);
    }
  };

  return <DateTimePicker
    className={styles.dateTimePicker}
    datePickerProps={{ className: styles.datePicker }}
    onChange={onDateTimePickerChange}
    value={`${dateValue}T${timeValueWithoutSecondsAndOffset}`}
    {...otherProps}
  />;
};

const TimeInput = ({ onChange, value, ...otherProps }) => {
  const [hourValue = '', minuteValue = ''] = (value || EMPTY_TIME_VALUE).split(':');
  const timeValueWithoutSecondsAndOffset = `${hourValue}:${minuteValue}`;

  const onTimePickerChange = (newTime) => {
    if (newTime === EMPTY_TIME_VALUE) {
      onChange(undefined);
    } else {
      // JSON schema time format expects the time with the timezone offset.
      const timeWithSecondsAndOffset = `${newTime}:00${getTimezoneOffsetString()}`;
      onChange(timeWithSecondsAndOffset);
    }
  };

  return <TimePicker onChange={onTimePickerChange} value={timeValueWithoutSecondsAndOffset} {...otherProps} />;
};

const INPUTS = {
  [DATE_TIME_ELEMENT_INPUT_TYPES.DATE]: DateInput,
  [DATE_TIME_ELEMENT_INPUT_TYPES.DATE_TIME]: DateTimeInput,
  [DATE_TIME_ELEMENT_INPUT_TYPES.TIME]: TimeInput,
};

const DateTime = ({ autofillDefaultInput: _autofillDefaultInput, details, error, id, onFieldChange, value = '' }) => {
  const Input = INPUTS[details.inputType];

  const hasError = !!error;
  const hasDescription = !!details.description && !hasError;
  const label = details.isRequired ? `${details.label} *` : details.label;

  return <div className={styles.dateTime} data-testid={`schema-form-date-time-field-${id}`}>
    <label className={`${styles.label} ${hasError ? styles.error : ''}`}>
      {label}

      <Input
        aria-describedby={hasDescription ? `${id}-description`: undefined}
        aria-errormessage={hasError ? `${id}-description` : undefined}
        aria-invalid={hasError}
        aria-required={details.isRequired}
        id={id}
        onChange={(value) => onFieldChange(id, value)}
        value={value}
      />
    </label>

    {(hasDescription || hasError) && <p
      aria-live={hasError ? 'assertive' : 'off'}
      className={`${styles.description} ${hasError ? styles.error : ''}`}
      id={`${id}-description`}
    >
      {error || details.description}
    </p>}
  </div>;
};

export default memo(DateTime);
