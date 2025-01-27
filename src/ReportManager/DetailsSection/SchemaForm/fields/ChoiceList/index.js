import React from 'react';
import { components as SelectComponent } from 'react-select';
import { useTranslation } from 'react-i18next';

import Select from '../../../../../Select';
import { CHOICE_LIST_ELEMENT_INPUT_TYPES } from '../../constants';

import styles from './styles.module.scss';

const Option = ({ data, ...restProps }) => {
  return <div>
    <SelectComponent.Option
            data={data}
            {...restProps}
        >
      <span className={styles.optionLabel}>
        {data.title}
      </span>
    </SelectComponent.Option>
  </div>;
};


const Dropdown = ({ details, onChange, value, id, hasError, disabled, ...otherProps }) => {

  const { t } = useTranslation('components', { keyPrefix: 'choiceList' });
  const getOptionLabel = (option) => option.title;
  const getOptionValue = (option) => option.const;

  return <div {...otherProps}>
    <Select
      isClearable={true}
      id={id}
      value={value}
      isMulti={details.multiple}
      isSearchable={true}
      onChange={onChange}
      options={details.choices.options}
      getOptionLabel={getOptionLabel}
      getOptionValue={getOptionValue}
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
      isDisabled={disabled}
      noOptionsMessage={() => t('noData')}
    />
  </div>;
};

const INPUTS = {
  [CHOICE_LIST_ELEMENT_INPUT_TYPES.DROPDOWN]: Dropdown
};

const ChoiceList = ({ details, error, id, onFieldChange, value = '' }) => {

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
          data-testid={`schemaForm-field-choiceList-${id}`}
          id={id}
          onChange={(newValue) => {
              onFieldChange(id, newValue);
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
