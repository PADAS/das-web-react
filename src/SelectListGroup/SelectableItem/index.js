import React, { forwardRef } from 'react';

import styles from './styles.module.scss';

const INPUT_ROLES = {
  CHECKBOX: 'checkbox',
  RADIO: 'radio'
};

const Ripple = ({ readOnly, disabled, children }) =>
  <div className={styles.rippleContainer}>
    {children}
    <div className={`${styles.ripple} ${!readOnly && !disabled ? styles.active : ''}`} />
  </div>
;

const SelectableItem = ({
  className = '',
  invalid,
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
  isMulti = true,
  ...otherProps
}, ref) => {

  const handleOnChange = (event) => {
    if (!readOnly && !disabled){
      event?.preventDefault();
      onClick(value, !isChecked);
    }
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

  return <div className={`${styles.container} ${disabled ? styles.disabled : ''} ${className} ${invalid ? styles.error : ''}`}
              onKeyDown={handleOnKeyDown}>
    <Ripple>
      <input type={isMulti ? INPUT_ROLES.CHECKBOX : INPUT_ROLES.RADIO}
             onFocus={() => setIsFocused(true, id)}
             onBlur={() => setIsFocused(false, id)}
             readOnly={readOnly}
             disabled={disabled}
             value={!isMulti ? value : undefined}
             checked={isChecked}
             id={id}
             name={ isMulti ? id : `${groupId}-option`}
             data-testid={`input-for-${label}`}
             onChange={handleOnChange}
             ref={ref}
             {...otherProps} />
    </Ripple>
    <label htmlFor={id}>
      {label}
    </label>
  </div>;
};

export default forwardRef(SelectableItem);
