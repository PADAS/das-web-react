import React, { useEffect, useState } from 'react';

import { ReactComponent as CheckIcon } from '../../common/images/icons/check-light.svg';

import styles from './index.module.scss';

const Checkbox = ({
  disabled = false,
  isChecked,
  label,
  onChange,
  readOnly = false,
  value,
  ...otherProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const id = `checkBox-${value}`;
  const handleOnChange = () => readOnly || disabled || onChange(value, !isChecked, id);

  const handleOnKeyDown = (event) => {
    if (isFocused && (event.code === 'Enter' || event.code === 'Space')){
      event.stopPropagation();
      event.preventDefault();

      handleOnChange();
    }
  };

  return <div tabIndex='0'
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleOnKeyDown}
              role='checkbox'
              aria-checked={isChecked}
              className={`${styles.checkbox} ${disabled ? styles.disabled : ''}`}>
    <div onClick={handleOnChange}
         className={`${styles.ripple} ${!readOnly && !disabled ? styles.active : ''}`}>
      <div className={`${styles.box} ${isChecked ? styles.checked : ''}`}>
        <CheckIcon role='img' />
      </div>
    </div>
    <label htmlFor={id}>
      {label}
    </label>
    <input type='checkbox'
           readOnly={readOnly}
           disabled={disabled}
           value={value}
           checked={isChecked}
           onChange={handleOnChange}
           id={id}
           {...otherProps} />
  </div>;
};

export default Checkbox;
