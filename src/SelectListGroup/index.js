import React, { useEffect, useMemo, useRef, useState } from 'react';

import SelectableItem from './SelectableItem';

import styles from './styles.module.scss';

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
  value: initialValue,
  ...otherProps
}) => {

  const optionsState = useMemo(() => options.map((option) => {
    const label = option.label ?? getOptionLabel?.(option);
    const value = calculateOptionValue(option, getOptionValue);
    return {
      isChecked: isOptionChecked(option, initialValue, isMulti, !initialValue || initialValue?.length === 0, getOptionValue),
      id: `${id}-${value}`,
      label,
      value,
    };
  }), [options, getOptionLabel, getOptionValue, initialValue, isMulti, id]);

  const [areOptionsFocused, setAreOptionsFocused] = useState(() => optionsState.map(({ id }) => ({
    id,
    isFocused: false
  })));

  const [autoFocusOptionId, setAutoFocusOptionId] = useState(null);
  const autoFocusRef = useRef(null);

  const handleOptionIsFocused = (isOptionFocused, optionId) => {
    const newOptionsIsFocused = areOptionsFocused.map((option) => {
      if (option.id === optionId) {
        option.isFocused = isOptionFocused;
      }
      return option;
    });

    setAreOptionsFocused(newOptionsIsFocused);
  };

  const isOptionFocused = (optionId) => !!areOptionsFocused.find((option) => option.id === optionId)?.isFocused;

  const handleOnSelectableItemClick = (selectedOptionValue, isChecked) => {
    if (isMulti){
      const isListEmpty = !initialValue || initialValue?.length === 0;
      const newValue = isChecked
        ? isListEmpty ? [selectedOptionValue] : [...initialValue, selectedOptionValue]
        : initialValue.filter((value) => value !== selectedOptionValue);

      onChange(newValue);
    } else {
      onChange(selectedOptionValue);
    }
  };

  const autoFocusSelectableItem = (currentFocusedOptionId, focusNextElement = true) => {
    const focusedOptionIndex = areOptionsFocused.findIndex((option) => currentFocusedOptionId === option.id);
    const autoFocusedOptionIndex = focusNextElement
      ? focusedOptionIndex !== areOptionsFocused.length - 1 ? focusedOptionIndex + 1 : focusedOptionIndex
      : focusedOptionIndex > 0 ? focusedOptionIndex - 1 : focusedOptionIndex;

    if (focusedOptionIndex !== autoFocusedOptionIndex){
      setAutoFocusOptionId(areOptionsFocused[autoFocusedOptionIndex].id);
    }
  };

  useEffect(() => {
    if (autoFocusOptionId){
      autoFocusRef?.current?.focus();
      setAutoFocusOptionId(null);
    }
  }, [autoFocusOptionId]);

  return <fieldset id={id} className={`${styles.fieldset} ${className} ${invalid ? styles.error : ''}`} {...otherProps}>
    <legend>{label}</legend>
    <div className={styles.container}>
      {
        optionsState.map(({ isChecked, label: optionLabel, value, id: optionId, index }) =>
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
              value={value}
              setIsFocused={handleOptionIsFocused}
              isFocused={isOptionFocused(optionId)}
              ref={optionId === autoFocusOptionId ? autoFocusRef : undefined}
              focusNextSelectableItem={autoFocusSelectableItem}
              focusPreviousSelectableItem={(currentFocusedOptionId) => autoFocusSelectableItem(currentFocusedOptionId, false)}
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
