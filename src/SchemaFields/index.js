import React, { Fragment, useEffect, useState } from 'react';
import Select from 'react-select';
import DateTimePicker from 'react-datetime-picker';
import isString from 'lodash/isString';

import { DATEPICKER_DEFAULT_CONFIG, DEFAULT_SELECT_STYLES } from '../constants';
import { trackEvent } from '../utils/analytics';
import { uuid } from '../utils/string';

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

  const handleChange = (update) => {
    if (!update) return onChange(update);

    const { label: name, value } = update;
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
  const instanceId = useState(uuid());

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
    <div className='json-schema-checkbox-wrapper checkboxes' id={id}>
      {enumOptions.map((option, index) => {

        const itemDisabled =
          enumDisabled && enumDisabled.findIndex(item => item.value === option.value) !== -1;
        const disabledCls =
          disabled || itemDisabled || readonly ? 'disabled' : '';
        const inputId = `${id}_${instanceId}_${index}`;
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

export const ObjectFieldTemplate = (props) => {
  const { TitleField, DescriptionField } = props;

  return <div className='container' style={{padding: 0}}>
    <div className='row'>
      {(props.title || props.uiSchema['ui:title']) && (
        <TitleField
          id={`${props.idSchema.$id}__title`}
          title={props.title || props.uiSchema['ui:title']}
          required={props.required}
          formContext={props.formContext}
        />
      )}
      {props.description && (
        <DescriptionField
          id={`${props.idSchema.$id}__description`}
          description={props.description}
          formContext={props.formContext}
        />
      )}
      {createGroupedFields({
        props,
        properties: props.properties,
        groups: props.uiSchema['ui:groups'],
      })}
    </div>
  </div>;
};

const GroupComponent = props => props.properties.map(p => p.children);

const createGroupedFields = ({ properties, groups, props }) => {
  if (!Array.isArray(groups)) {
    return properties.map(p => p.content);
  }
  const mapped = groups.map((g) => {
    if (typeof g === 'string') {
      const found = properties.filter(p => p.name === g);
      if (found.length === 1) {
        const el = found[0];
        return el.content;
      }
      return null;
    } else if (typeof g === 'object') {
      
      const _properties = Object.entries(g).reduce((acc, [key, field]) => {
        if (key.startsWith('ui:') 
        || !Array.isArray(field)) {
          return acc;
        }
        return [
          ...acc,
          {
            name: key,
            children: createGroupedFields({
              properties,
              props,
              groups: field
            })
          }
        ];
      }, []);
      return <div className={`fieldset ${g.htmlClass || 'col-sm-12'}`}>
        {g.title && <legend>{g.title}</legend>}
        <GroupComponent properties={_properties} />
      </div>;
    }
    throw new Error('Invalid grouping' + typeof g + ' ' + g);
  });
  return mapped;
};