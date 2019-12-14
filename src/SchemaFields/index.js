import React, { Fragment, useEffect } from 'react';
import Select from 'react-select';
import DateTimePicker from 'react-datetime-picker';
import isString from 'lodash/isString';

import { DATEPICKER_DEFAULT_CONFIG, DEFAULT_SELECT_STYLES } from '../constants';
import { trackEvent } from '../utils/analytics';

import { ReactComponent as ExternalLinkIcon } from '../common/images/icons/external-link.svg';

import styles from './styles.module.scss';


const SelectField = (props) => {
  const { id, value, placeholder, required, onChange, options: { enumOptions } } = props;

  const getOptionLabel = ({ label, name }) => label || name;
  const getOptionValue = ({ value }) => value;
  const selected = enumOptions.find((item) => value ?
    item.value ===
    (isString(value) ?
      value : value.value)
    : null
  );

  const handleChange = ({ label: name, value }) => {
    return onChange({ name, value });
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
    styles={DEFAULT_SELECT_STYLES}
  />;
};


const DateTimeField = (props) => {
  const { idSchema: { id }, schema: { title: label }, onChange, required, formData } = props;
  const date = formData ? new Date(formData) : undefined;

  const handleChange = newVal => onChange(newVal ? newVal.toISOString() : newVal);

  return <Fragment>
    <label htmlFor={id}>{label}</label>
    <DateTimePicker className={styles.datepicker} id={id} required={required} {...DATEPICKER_DEFAULT_CONFIG} maxDate={new Date()} value={date} onChange={handleChange} />
  </Fragment>;
};

const CustomCheckboxes = (props) => {
  const { id, disabled, options, value, autofocus, readonly, onChange } = props;
  const { enumOptions, enumDisabled, inline } = options;

  const inputValues = value.map(val => {
    if (isString(val)) return val;
    return val.value;
  });

  useEffect(() => {
    setTimeout(() => {
      if (value.some(v => !isString(v))) {
        onChange(inputValues);
      }
    });
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const enumOptionIsChecked = option => inputValues.findIndex(item => item === option.value) !== -1;

  return (
    <div className='checkboxes' id={id}>
      {enumOptions.map((option, index) => {

        const itemDisabled =
          enumDisabled && enumDisabled.findIndex(item => item.value === option.value) !== -1;
        const disabledCls =
          disabled || itemDisabled || readonly ? 'disabled' : '';
        const inputId = `${id}_${index}`;
        const checkbox = (
          <span>
            <input
              type='checkbox'
              id={inputId}
              checked={enumOptionIsChecked(option)}
              disabled={disabled || itemDisabled || readonly}
              autoFocus={autofocus && index === 0}
              onChange={event => {
                if (enumOptionIsChecked(option)) {
                  onChange(inputValues.filter(item => item !== option.value));
                } else {
                  onChange([...inputValues, option.value]);
                }
              }}
            />
            <span>{option.label}</span>
          </span>
        );
        return inline ? (
          <label htmlFor={inputId} key={index} className={`checkbox-inline ${disabledCls}`}>
            {checkbox}
          </label>
        ) : (
            <div key={index} className={`checkbox ${disabledCls}`}>
              <label htmlFor={inputId}>{checkbox}</label>
            </div>
          );
      })}
    </div>
  );
};


const ExternalLink = (props) => {
  const { idSchema: { id }, schema: { title: label }, formData: value } = props;

  const onLinkClick = () => {
    trackEvent(
      'Event Report',
      'Click \'External Source\' link',
      value.replace('http://', '').replace('https://', '').split(/[/?#:]/g)[0]
    );
  };

  return <div>
    <label className={styles.linkLabel} htmlFor={id}>{label}
      <a onClick={onLinkClick} target='_blank' rel='noopener noreferrer' href={value}>
        <ExternalLinkIcon />
      </a>
    </label>
    <a onClick={onLinkClick} target='_blank' rel='noopener noreferrer' href={value}>{value}</a>
  </div>;
};

export default {
  select: SelectField,
  checkboxes: CustomCheckboxes,
  datetime: DateTimeField,
  externalUri: ExternalLink,
};