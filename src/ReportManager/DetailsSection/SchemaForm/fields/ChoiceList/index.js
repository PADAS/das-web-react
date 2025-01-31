import React, { useState } from 'react';
import { components as SelectComponent } from 'react-select';
import { useTranslation } from 'react-i18next';
import ReactSelect from 'react-select';

import { ReactComponent as CheckIcon } from '../../../../../common/images/icons/check-light.svg';

import { CHOICE_LIST_ELEMENT_INPUT_TYPES } from '../../constants';

import styles from './styles.module.scss';
import Checkbox from '../../../../../SelectListGroup/Checkbox';

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

  const [isMenuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation('components', { keyPrefix: 'choiceList' });

  const selectedValue = details.multiple ? value : details.options.find((item) => item.const === value);

  const handleOnChange = (newValue) => {
    if ( ( details.multiple && newValue.length === 0 ) || !newValue){
      return onChange(undefined);
    }
    const returnedValue = details.multiple ? newValue.map((item) => item.const ?? item) : newValue.const;
    return onChange( returnedValue );
  };

  const onMenuClose = () => setMenuOpen(false);

  const onMenuOpen = () => setMenuOpen(true);

  const onKeyDown = (event) => {
    if (event.key === 'Escape' && isMenuOpen) {
      event.stopPropagation();
    }
  };

  return <ReactSelect
      components={{ Option }}
      classNames={{
          control: (state) => `${styles.control} ${ hasError ? styles.dropdownError : '' } ${ state.isFocused ? styles.controlFocused : '' }`,
          dropdownIndicator: () => styles.cursorPointer,
          indicatorsContainer: () => hasError && styles.caretError,
          indicatorSeparator: () => styles.separator,
          multiValue: () => styles.multiValue,
          multiValueRemove: () => styles.multiValueRemove,
          option: () => styles.cursorPointer,
          placeholder: () => hasError && styles.error,
      }}
      getOptionLabel={(option) => option.title ?? details.options.find((item) => item.const === option).title}
      getOptionValue={(option) => option.const ?? option}
      isClearable
      isDisabled={disabled}
      inputId={id}
      isMulti={details.multiple}
      isSearchable
      onChange={handleOnChange}
      noOptionsMessage={() => t('select.noOptionsMessage')}
      options={details.options}
      onMenuClose={onMenuClose}
      onMenuOpen={onMenuOpen}
      onKeyDown={onKeyDown}
      placeholder={details.hint}
      value={selectedValue}
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
      {label}

      <Input
          aria-describedby={hasDescription ? `${id}-description`: ''}
          aria-errormessage={hasError ? `${id}-description` : ''}
          aria-invalid={hasError}
          hasError={hasError}
          aria-required={details.isRequired}
          id={id}
          onChange={(newValue) => onFieldChange(id, newValue)}
          value={value}
          details={details} />
    </label>

    {(hasDescription || hasError) && <p
          aria-live={hasError ? 'assertive' : 'off'}
          className={`${styles.description} ${hasError ? styles.error : ''}`}
          id={`${id}-description`}
      >
        {error?.message || details.description}
      </p>}
    <Checkbox onChange={(...args) => {
         console.log(args);
     }} value={120} label='A checkbox' isChecked={false} />
  </div>;
};

export default ChoiceList;
