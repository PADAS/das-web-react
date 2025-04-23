import React, { useMemo } from 'react';

import SelectableItem from './SelectableItem';

import * as styles from './styles.module.scss';

const calculateOptionValue = (option, getOptionValue = null) => option.value ?? getOptionValue?.(option);

const isOptionChecked = (option, currentSelectListValue, isMulti, isAnyOptionChecked, getOptionValue = null) => {
  const optionValue = calculateOptionValue(option, getOptionValue);
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
  invalid,
  id = '',
  isMulti = true,
  label,
  options,
  onChange,
  readOnly,
  value,
  ...otherProps
}) => {

  const optionsState = useMemo(() => options.map((option) => {
    const label = option.label ?? getOptionLabel?.(option);
    const optionValue = calculateOptionValue(option, getOptionValue);
    return {
      isChecked: isOptionChecked(option, value, isMulti, !value || value?.length === 0, getOptionValue),
      id: `${id}-${optionValue}`,
      label,
      value: optionValue
    };
  }), [options, getOptionLabel, getOptionValue, value, isMulti, id]);

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

  return <fieldset disabled={disabled} id={id} className={`${styles.fieldset} ${className} ${invalid ? styles.error : ''}`} {...otherProps}>
    <legend>{label}</legend>
    <div className={styles.container}>
      {
        optionsState.map(({ isChecked, label: optionLabel, value: optionValue, id: optionId, index }) =>
          <SelectableItem
              disabled={disabled}
              groupId={id}
              invalid={invalid}
              isChecked={isChecked}
              id={optionId}
              isMulti={isMulti}
              key={optionId}
              label={optionLabel}
              onClick={handleOnSelectableItemClick}
              readOnly={readOnly}
              value={optionValue}
              aria-required={
                isMulti
                    ? ariaRequired
                    : !isMulti && ariaRequired && index === 0 ? ariaRequired : undefined
              }
          />
        )
      }
    </div>
  </fieldset>;
};

export default SelectListGroup;
