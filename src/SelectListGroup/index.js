import React, { useCallback, useMemo } from 'react';

import { uuid } from '../utils/string';

import SelectableItem from './SelectableItem';

import styles from './styles.module.scss';

const SelectListGroup = ({
  className = '',
  disabled = false,
  getOptionLabel = null,
  getOptionValue = null,
  hasError,
  id = '',
  isMulti = true,
  options,
  onChange,
  readOnly,
  value: selectListValue,
  ...otherProps
}) => {

  const isListEmpty = useMemo(() => !selectListValue || selectListValue?.length === 0, [selectListValue]);

  const calculateOptionValue = useCallback((option) => option.value ?? getOptionValue?.(option), [getOptionValue]);

  const isOptionChecked = useCallback((option, currentSelectListValue, isMulti) => {
    const optionValue = calculateOptionValue(option);
    if (isMulti) {
      return isListEmpty ? false : currentSelectListValue.includes(optionValue);
    }

    return optionValue === currentSelectListValue;
  }, [calculateOptionValue, isListEmpty]);

  const optionsState = useMemo(() => options.reduce((state, option) => {

    state[uuid()] = {
      isChecked: isOptionChecked(option, selectListValue, isMulti),
      label: option.label ?? getOptionLabel?.(option),
      value: calculateOptionValue(option),
    };

    return state;
  }, {}), [options, calculateOptionValue, isOptionChecked, selectListValue, isMulti, getOptionLabel]);

  const handleOnSelectableItemClick = (selectedOptionValue, isChecked) => {
    if (isMulti){
      const newValue = isChecked
        ? isListEmpty ? [selectedOptionValue] : [...selectListValue, selectedOptionValue]
        : selectListValue.filter((value) => value !== selectedOptionValue);

      onChange(newValue);
    } else {
      onChange(selectedOptionValue);
    }
  };

  return <div id={id} className={`${styles.container} ${className} ${hasError ? styles.error : ''}`} tabIndex='0'>
    {
      Object.keys(optionsState).map((optionKey) =>
        <SelectableItem
            disabled={disabled}
            hasError={hasError}
            isChecked={optionsState[optionKey].isChecked}
            id={optionKey}
            isMulti={isMulti}
            key={optionKey}
            label={optionsState[optionKey].label}
            onClick={handleOnSelectableItemClick}
            readOnly={readOnly}
            value={optionsState[optionKey].value}
            {...otherProps} />
      )
    }
  </div>;
};

export default SelectListGroup;
