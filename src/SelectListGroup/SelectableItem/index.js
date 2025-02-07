import React, { useState } from 'react';

import { ReactComponent as CheckIcon } from '../../common/images/icons/check-light.svg';

import styles from './styles.module.scss';

const Ripple = ({ onClick, readOnly, disabled, children }) =>
  <div className={`${styles.ripple} ${!readOnly && !disabled ? styles.active : ''}`}
         onClick={onClick}>
    {children}
  </div>;

const SelectableItemIcon = ({ isMulti, isChecked, fieldId, hasError }) =>
  isMulti
    ? <div className={`${styles.checkboxIconWrapper} ${isChecked ? styles.checked : ''} ${hasError ? styles.iconError : ''}`}
         data-testid={`selectable-item-icon-${fieldId}`}>
      <CheckIcon role='img' />
    </div>
    : <div className={`${styles.radioIconWrapper} ${isChecked ? styles.checked : ''} ${hasError ? styles.iconError : ''}`}
         data-testid={`selectable-item-icon-${fieldId}`}>
      { isChecked && <div className={styles.radioBoxIcon} /> }
    </div>
;

const SelectableItem = ({
  className = '',
  hasError,
  disabled = false,
  isChecked,
  id,
  label,
  onClick,
  readOnly = false,
  value,
  isMulti = true,
  ...otherProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const role = isMulti ? 'checkbox' : 'radio';

  const handleOnClick = (event) => {
    event?.preventDefault();
    readOnly || disabled || onClick(value, !isChecked);
  };

  const handleOnKeyDown = (event) => {
    if (isFocused && (event.code === 'Enter' || event.code === 'Space')){
      event.stopPropagation();
      event.preventDefault();

      handleOnClick();
    }
  };

  return <div className={`${styles.container} ${disabled ? styles.disabled : ''} ${className} ${hasError ? styles.error : ''}`}
              tabIndex='0'
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleOnKeyDown}
              aria-checked={isChecked} onClick={handleOnClick}>

    <Ripple readOnly={readOnly} disabled={disabled}>
      <SelectableItemIcon isMulti={isMulti} isChecked={isChecked} fieldId={id} hasError={hasError} />
    </Ripple>

    <label title={label}>
      {label}
    </label>

    <input type={role}
           readOnly={readOnly}
           disabled={disabled}
           value={value}
           defaultChecked={isChecked}
           id={id}
           data-testid={`input-for-${label}`}
           {...otherProps} />
  </div>;
};

export default SelectableItem;
