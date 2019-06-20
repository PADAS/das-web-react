import React, { memo, Fragment } from 'react';
import Select from 'react-select';
import DateTimePicker from 'react-datetime-picker';

import { DATEPICKER_DEFAULT_CONFIG } from '../constants';

import styles from './styles.module.scss';

const SelectField = (props) => {
  const { id, value, placeholder, required, onChange, options: { enumOptions } } = props;

  const getOptionLabel = ({ label, name }) => label || name;
  const getOptionValue = ({ value }) => value;
  const selected = enumOptions.find(({ value:v }) => v === value);

  const handleChange = (update) => {
    if (update) return onChange(update.value);
    return onChange(update);
  };

  return <Select
    id={id}
    required={required}
    value={selected}
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
  const { idSchema: { id }, schema: { title:label }, onChange, required, formData } = props;
  const date = formData ? new Date(formData) : undefined;

  const handleChange = newVal => onChange(newVal ? newVal.toISOString() : newVal);

  return <Fragment>
    <label htmlFor={id}>{label}</label>
    <DateTimePicker className={styles.datepicker} id={id} required={required} {...DATEPICKER_DEFAULT_CONFIG} maxDate={new Date()} value={date} onChange={handleChange} />
  </Fragment>;
};

export default {
  select: memo(SelectField),
  datetime: memo(DateTimeField),
};