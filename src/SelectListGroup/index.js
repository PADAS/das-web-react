import React, { useEffect, useMemo, useRef, useState } from 'react';

import SelectableItem from './SelectableItem';

import styles from './styles.module.scss';

const calculateOptionValue = (option, getOptionValue = null) => option.value ?? getOptionValue?.(option);

const isOptionChecked = (option, currentSelectListValue, isMulti, isListEmpty) => {
  const optionValue = calculateOptionValue(option);
  if (isMulti) {
    return isListEmpty ? false : currentSelectListValue.includes(optionValue);
  }

  return optionValue === currentSelectListValue;
};

const SelectListGroup = ({
  className = '',
  disabled = false,
  getOptionLabel = null,
  getOptionValue = null,
  hasError,
  id = '',
  isMulti = true,
  label,
  options,
  onChange,
  readOnly,
  value: selectListValue,
  ...otherProps
}) => {

  const optionsState = useMemo(() => options.map((option) => {
    const label = option.label ?? getOptionLabel?.(option);
    const value = calculateOptionValue(option, getOptionValue);
    return {
      isChecked: isOptionChecked(option, selectListValue, isMulti, !selectListValue || selectListValue?.length === 0),
      id: `${id}-${value}`,
      label,
      value,
    };
  }), [options, getOptionLabel, getOptionValue, selectListValue, isMulti, id]);

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
      const isListEmpty = !selectListValue || selectListValue?.length === 0;
      const newValue = isChecked
        ? isListEmpty ? [selectedOptionValue] : [...selectListValue, selectedOptionValue]
        : selectListValue.filter((value) => value !== selectedOptionValue);

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
    setAutoFocusOptionId(areOptionsFocused[autoFocusedOptionIndex].id);
  };

  useEffect(() => {
    if (autoFocusOptionId){
      setTimeout(() => {
        autoFocusRef?.current?.focus();
        setAutoFocusOptionId(null);
      }, 100);
    }
  }, [autoFocusOptionId]);

  return <fieldset id={id} className={`${styles.container} ${className} ${hasError ? styles.error : ''}`} {...otherProps}>
    <legend>{label}</legend>
    {
      optionsState.map(({ isChecked, label: optionLabel, value, id: optionId }) =>
        <SelectableItem
            disabled={disabled}
            groupId={id}
            hasError={hasError}
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
        />
      )
    }
  </fieldset>;
};

export default SelectListGroup;
