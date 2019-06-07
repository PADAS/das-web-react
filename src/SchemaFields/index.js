import React, { memo } from 'react';
import Select from 'react-select';
import DateTimePicker from 'react-datetime-picker';

import { DATEPICKER_DEFAULT_CONFIG } from '../constants';

const SelectField = (props) => {
  const { id, value, placeholder, required, onChange, options: { enumOptions } } = props;

  const getOptionLabel = ({ label }) => label;
  const getOptionValue = ({ value }) => value;

  const handleChange = (update) => {
    if (update) return onChange(update.value);
    return onChange(update);
  };

  return <Select
    id={id}
    required={required}
    value={value ? value.value : undefined}
    options={enumOptions}
    placeholder={placeholder}
    isClearable={true}
    isSearchable={true}
    getOptionLabel={getOptionLabel}
    getOptionValue={getOptionValue}
    onChange={handleChange}
  />;
};


const DateTimeField = (props) => {
  const { id, value, required, onChange } = props;
  const date = value ? new Date(value) : undefined;

  const handleChange = newVal => onChange(newVal ? newVal.toISOString() : newVal);

  return <DateTimePicker id={id} required={required} {...DATEPICKER_DEFAULT_CONFIG} maxDate={new Date()} value={date} onChange={handleChange} />
};

export default {
  select: SelectField,
  datetime: DateTimeField,
};