import React, { useMemo } from 'react';

import SelectableItem from './SelectableItem';

import * as styles from './styles.module.scss';

// A getter is passed to read a field the option names differently, so it wins
// over an option field of the same name that means something else.
const resolveOptionField = (option, field, getOptionField) => getOptionField
  ? getOptionField(option)
  : option[field];

const isOptionChecked = (optionValue, currentSelectListValue, isMulti, isAnyOptionChecked) => {
  if (isMulti) {
    return isAnyOptionChecked ? false : currentSelectListValue.includes(optionValue);
  }
  return optionValue === currentSelectListValue;
};

const SelectListGroup = ({
  'aria-required': ariaRequired,
  className = '',
  columnCount = 1,
  disabled = false,
  getOptionDescription = null,
  getOptionLabel = null,
  getOptionValue = null,
  id = '',
  invalid,
  isMulti = true,
  label,
  onChange,
  options,
  readOnly = false,
  renderOptionIcon = null,
  value,
  ...otherProps
}) => {
  const optionItems = useMemo(() => options.map((option) => {
    const optionValue = resolveOptionField(option, 'value', getOptionValue);

    return {
      description: resolveOptionField(option, 'description', getOptionDescription),
      icon: renderOptionIcon?.(option) ?? null,
      id: `${id}-${optionValue}`,
      isChecked: isOptionChecked(optionValue, value, isMulti, !value || value?.length === 0),
      label: resolveOptionField(option, 'label', getOptionLabel),
      value: optionValue
    };
  }), [getOptionDescription, getOptionLabel, getOptionValue, id, isMulti, options, renderOptionIcon, value]);

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

    <div className={styles.container} style={{ '--select-list-group-column-count': columnCount }}>
      {optionItems.map((optionItem, index) => <SelectableItem
        aria-required={isMulti
          ? ariaRequired
          : index === 0 && ariaRequired ? ariaRequired : undefined
        }
        description={optionItem.description}
        disabled={disabled}
        groupId={id}
        icon={optionItem.icon}
        id={optionItem.id}
        invalid={invalid}
        isChecked={optionItem.isChecked}
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
