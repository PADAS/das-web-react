import React from 'react';
import { CHOICE_LIST_ELEMENT_INPUT_TYPES } from '../../constants';

import Select from '../../../../../Select';
import { components as SelectComponent } from 'react-select';

import styles from './styles.module.scss';


const Option = ({ data, ...restProps }) => {
  return <div>
    <SelectComponent.Option
            data={data}
            {...restProps}
        >
      <span className={styles.optionLabel}>
        {data.label}
      </span>
    </SelectComponent.Option>
  </div>;

};


const Dropdown = ({ details, onChange, value, id, hasError, ...otherProps }) => {
  console.log(value);
  const options = [{
    label: 'An option',
    value: 44,
  },
  {
    label: 'Another option',
    value: 23,
  },
  {
    label: 'Extra option',
    value: 33,
  }];

  return <div {...otherProps}>
    <Select
      isClearable={true}
      id={id}
      value={value}
      isMulti={details.multiple}
      isSearchable={true}
      onChange={onChange}
      options={options}
      placeholder={details.hint}
        components={{ Option }}
        classNames={{
          control: () => hasError && styles.dropdownError,
          multiValue: () => styles.multiValue,
          multiValueRemove: () => styles.multiValueRemove,
          placeholder: () => hasError && styles.error,
          indicatorSeparator: () => hasError && styles.separatorError,
          indicatorsContainer: () => hasError && styles.caretError,
      }}
      />
  </div>;
};

const INPUTS = {
  [CHOICE_LIST_ELEMENT_INPUT_TYPES.DROPDOWN]: Dropdown
};

/* ToDO:
* - There is an error with items prop $ref which tries to get the items from a ref of EFB env and not being able to solve it
* - check how to fetch options
* - check dropdown state like readonly, disabled, etc
* - i18n for dropdown state
* - how the value is going to be stored?
* */
const ChoiceList = ({ autofillDefaultInput, details, error, id, onFieldChange, value = '' }) => {
  const Input = INPUTS[details.inputType];

  const hasError = !!error;
  const hasDescription = !!details.description && !hasError;
  const label = details.isRequired ? `${details.label} *` : details.label;

  return <div>
    <label className={`${styles.dropdownWrapper} ${hasError ? styles.error : ''}`}>
      {label}

      <Input
          aria-describedby={hasDescription ? `${id}-description`: undefined}
          aria-errormessage={hasError ? `${id}-description` : undefined}
          aria-invalid={hasError}
          hasError={hasError}
          aria-required={details.isRequired}
          data-testid={`schemaForm-field-dateTime-${id}`}
          id={id}
          onChange={(value) => {
            onFieldChange(id, value?.length > 0 ? value : undefined);
          }}
          value={value}
          details={details} />
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

export default ChoiceList;
