import React from 'react';
import { components as SelectComponent } from 'react-select';
import { useTranslation } from 'react-i18next';
import ReactSelect from 'react-select';

import { ReactComponent as CheckIcon } from '../../../../../common/images/icons/check-light.svg';

import { CHOICE_LIST_ELEMENT_INPUT_TYPES } from '../../constants';

import styles from './styles.module.scss';

const Option = ({ data, isSelected, isMulti, ...restProps }) => <div>
  <SelectComponent.Option data={data} isMulti={isMulti} {...restProps}>
    {
      isSelected && !isMulti && <CheckIcon className={styles.checkMark} />
    }
    <span className={`${styles.optionLabel} ${ !isMulti && !isSelected && styles.singleOption }`}>
      {data.title}
    </span>
  </SelectComponent.Option>
</div>;


const Dropdown = ({ details, onChange, value, id, hasError, disabled, ...otherProps }) => {

  const { t } = useTranslation('components', { keyPrefix: 'choiceList' });

  const selectedValue = details.multiple && Array.isArray(value) ? value : details.options.find((item) => item.const === value);

  const getOptionLabel = (option) => {
    return option.title ?? details.options.find((item) => item.const === option).title;
  };

  const getOptionValue = (option) => {
    return option.const ?? option;
  };

  const handleOnChange = (newValue) => {
    const isValueArray = Array.isArray(newValue);
    if ( ( isValueArray && newValue.length === 0 ) || !newValue){
      return onChange(undefined);
    }
    const returnedValue = isValueArray ? newValue.map((item) => item.const ?? item) : newValue.const;
    return onChange( returnedValue );
  };

  return <ReactSelect
      isClearable={true}
      id={id}
      value={selectedValue}
      isMulti={details.multiple}
      isSearchable={true}
      onChange={handleOnChange}
      options={details.options}
      getOptionLabel={getOptionLabel}
      getOptionValue={getOptionValue}
      placeholder={details.hint}
        components={{ Option }}
        classNames={{
          control: () => hasError && styles.dropdownError,
          multiValue: () => styles.multiValue,
          multiValueRemove: () => styles.multiValueRemove,
          placeholder: () => hasError && styles.error,
          indicatorSeparator: () => styles.separator,
          indicatorsContainer: () => hasError && styles.caretError,
      }}
      isDisabled={disabled}
      noOptionsMessage={() => t('select.noOptionsMessage')}
      {...otherProps}
    />;
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
      <p>{label}</p>

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
