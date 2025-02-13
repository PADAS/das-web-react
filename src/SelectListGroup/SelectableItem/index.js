import React, { forwardRef } from 'react';

import styles from './styles.module.scss';

const Ripple = ({ onClick, readOnly, disabled, children }) =>
  <div className={`${styles.ripple} ${!readOnly && !disabled ? styles.active : ''}`}
         onClick={onClick}>
    {children}
  </div>;

const SelectableItem = ({
  className = '',
  hasError,
  disabled = false,
  focusNextSelectableItem,
  focusPreviousSelectableItem,
  groupId,
  isChecked,
  id,
  isFocused,
  label,
  onClick,
  readOnly = false,
  setIsFocused,
  value,
  isMulti = true
}, ref) => {

  const role = isMulti ? 'checkbox' : 'radio';

  const handleOnChange = (event) => {
    event?.preventDefault();
    readOnly || disabled || onClick(value, !isChecked);
  };

  const handleOnKeyDown = (event) => {
    if (isFocused) {
      switch (event.key) {
      case 'Enter':
      case 'Space':
        event.stopPropagation();
        event.preventDefault();
        handleOnChange();
        break;

      case 'ArrowDown':
      case 'ArrowRight':
        focusNextSelectableItem?.(id);
        break;

      case 'ArrowUp':
      case 'ArrowLeft':
        focusPreviousSelectableItem?.(id);
        break;

      default:
        break;
      }
    }
  };

  return <div className={`${styles.container} ${disabled ? styles.disabled : ''} ${className} ${hasError ? styles.error : ''}`}
              onKeyDown={handleOnKeyDown}>
    <Ripple>
      <input type={role}
             onFocus={() => setIsFocused(true, id)}
             onBlur={() => setIsFocused(false, id)}
             readOnly={readOnly}
             disabled={disabled}
             value={value}
             checked={isChecked}
             id={id}
             name={ isMulti ? id : `${groupId}-option`}
             data-testid={`input-for-${label}`}
             onChange={handleOnChange}
             ref={ref} />
    </Ripple>

    <label htmlFor={id}>
      {label}
    </label>
  </div>;
};

const SelectableItemWithRef = forwardRef(SelectableItem);

export default SelectableItemWithRef;
