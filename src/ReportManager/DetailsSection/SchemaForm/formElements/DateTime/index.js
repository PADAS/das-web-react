import React, { memo } from 'react';
import { format } from 'date-fns';

import { DATE_TIME_ELEMENT_INPUT_TYPES } from '../../../../../utils/v2-event-schemas/constants';

import DatePicker, { isValidDate, EMPTY_DATE_VALUE } from '../../../../../DatePicker';
import DateTimePicker, { EMPTY_DATE_TIME_VALUE } from '../../../../../DateTimePicker';
import TimePicker, { EMPTY_TIME_VALUE } from '../../../../../TimePicker';

import * as styles from './styles.module.scss';

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
      // JSON schema date time format expects the date time with seconds and timezone offset. If the new date is valid,
      // consider the offset of that date (to match the daylight saving), otherwise consider the current date offset.
      const [newDateValue] = newDateTime.split('T');
      const newOffset = format(isValidDate(newDateValue) ? newDateValue : new Date(), 'xxx');
      const dateTimeWithSecondsAndOffset = `${newDateTime}:00${newOffset}`;
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
      // JSON schema time format expects the time with seconds and timezone offset.
      const timeWithSecondsAndOffset = `${newTime}:00${format(new Date(), 'xxx')}`;
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

const DateTime = ({ details, error, id, onFieldChange, readOnly, value = '' }) => {
  const Input = INPUTS[details.inputType];

  const hasError = !!error;

  return <div
      className={styles.dateTime}
      data-testid={`schema-form-date-time-field-${id}`}
    >
    <label className={`${styles.label} ${hasError ? styles.error : ''}`}>
      {details.label}

      {details.isRequired && <span aria-hidden="true"> *</span>}

      <Input
        aria-describedby={`${id}-description`}
        aria-errormessage={hasError ? `${id}-description` : undefined}
        aria-invalid={hasError ? 'true' : 'false'}
        aria-required={details.isRequired}
        data-testid={`schemaForm-field-dateTime-${id}`}
        id={id}
        onChange={(value) => onFieldChange(id, value)}
        readOnly={readOnly}
        value={value}
      />
    </label>

    <p
      className={`${styles.description} ${hasError ? styles.error : ''}`}
      id={`${id}-description`}
    >
      {error?.message || details.description}
    </p>
  </div>;
};

export default memo(DateTime);
