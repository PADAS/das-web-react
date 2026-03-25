import React, { useMemo } from 'react';

import SelectableItem from './SelectableItem';

import * as styles from './styles.module.scss';

const isOptionChecked = (option, currentSelectListValue, isMulti, isAnyOptionChecked, getOptionValue = null) => {
  const optionValue = option.value ?? getOptionValue?.(option);

  if (isMulti) {
    return isAnyOptionChecked ? false : currentSelectListValue.includes(optionValue);
  }
  return optionValue === currentSelectListValue;
};

const SelectListGroup = ({
  'aria-required': ariaRequired,
  className = '',
  disabled = false,
  getOptionLabel = null,
  getOptionValue = null,
  id = '',
  invalid,
  isMulti = true,
  label,
  onChange,
  options,
  readOnly = false,
  value,
  ...otherProps
}) => {
  const optionItems = useMemo(() => options.map((option) => {
    const optionValue = option.value ?? getOptionValue?.(option);

    return {
      isChecked: isOptionChecked(option, value, isMulti, !value || value?.length === 0, getOptionValue),
      id: `${id}-${optionValue}`,
      label: option.label ?? getOptionLabel?.(option),
      value: optionValue
    };
  }), [getOptionLabel, getOptionValue, id, isMulti, options, value]);

  const handleOnSelectableItemClick = (selectedOptionValue, isChecked) => {
    if (isMulti){
      const isListEmpty = !value || value?.length === 0;
      const newValue = isChecked
        ? isListEmpty ? [selectedOptionValue] : [...value, selectedOptionValue]
        : value.filter((optionValue) => optionValue !== selectedOptionValue);

      onChange(newValue);
    } else {
      onChange(selectedOptionValue);
    }
  };

  return <fieldset
      className={`${styles.fieldset} ${invalid ? styles.error : ''} ${readOnly ? styles.readOnly : ''} ${className}`}
      disabled={disabled}
      id={id}
      {...otherProps}
    >
    <legend>
      {label}

      {ariaRequired && <span aria-hidden="true"> *</span>}
    </legend>

    <div className={styles.container}>
      {optionItems.map((optionItem, index) => <SelectableItem
        aria-required={isMulti
          ? ariaRequired
          : index === 0 && ariaRequired ? ariaRequired : undefined
        }
        disabled={disabled}
        groupId={id}
        invalid={invalid}
        isChecked={optionItem.isChecked}
        id={optionItem.id}
        isMulti={isMulti}
        key={optionItem.id}
        label={optionItem.label}
        onClick={handleOnSelectableItemClick}
        readOnly={readOnly}
        value={optionItem.value}
      />)}
    </div>
  </fieldset>;
};

export default SelectListGroup;
