import React, { useState } from 'react';

import { ReactComponent as CheckIcon } from '../../common/images/icons/check-light.svg';

import styles from './styles.module.scss';

const Ripple = ({ onClick, readOnly, disabled, children }) =>
  <div className={`${styles.ripple} ${!readOnly && !disabled ? styles.active : ''}`}
         onClick={onClick}>
    {children}
  </div>;

const SelectableItemIcon = ({ isMulti, isChecked, id }) => isMulti
  ? <div className={`${styles.checkboxIconWrapper} ${isChecked ? styles.checked : ''}`}
           data-testid={`selectable-item-icon-${id}`}>
    <CheckIcon role='img' />
  </div>
  : <div className={`${styles.radioIconWrapper} ${isChecked ? styles.checked : ''}`}
           data-testid={`selectable-item-icon-${id}`}>
    { isChecked && <div className={styles.radioBoxIcon} /> }
  </div>;

const SelectableItem = ({
  className = '',
  disabled = false,
  isChecked,
  id,
  label,
  onChange,
  readOnly = false,
  value,
  isMulti = true,
  ...otherProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const role = isMulti ? 'checkbox' : 'radio';

  const handleOnChange = () => readOnly || disabled || onChange(value, !isChecked);

  const handleOnKeyDown = (event) => {
    if (isFocused && (event.code === 'Enter' || event.code === 'Space')){
      event.stopPropagation();
      event.preventDefault();

      handleOnChange();
    }
  };

  return <div className={`${styles.container} ${disabled ? styles.disabled : ''} ${className}`}
              tabIndex='0'
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleOnKeyDown}
              role={role}
              aria-checked={isChecked}>

    <Ripple onClick={handleOnChange} readOnly={readOnly} disabled={disabled}>
      <SelectableItemIcon isMulti={isMulti} isChecked={isChecked} id={id} />
    </Ripple>

    <label htmlFor={id}>
      {label}
    </label>

    <input type={role}
           readOnly={readOnly}
           disabled={disabled}
           value={value}
           checked={isChecked}
           onChange={handleOnChange}
           id={id}
           {...otherProps} />
  </div>;
};

export default SelectableItem;
