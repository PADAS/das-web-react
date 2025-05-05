import React from 'react';

import * as styles from './styles.module.scss';

const SelectableItem = ({
  className = '',
  disabled = false,
  groupId,
  id,
  invalid,
  isChecked,
  isMulti = true,
  label,
  onClick,
  readOnly = false,
  ref,
  value,
  ...otherProps
}) => {
  const onChange = (event) => {
    if (!readOnly){
      event?.preventDefault();

      onClick(value, !isChecked);
    }
  };

  return <div className={`${styles.selectableItem} ${className}`}>
    <div className={`${styles.ripple} ${!readOnly && !disabled ? styles.active : ''}`}>
      <input
        checked={isChecked}
        className={styles.input}
        data-testid={`input-for-${label}`}
        disabled={disabled}
        id={id}
        name={isMulti ? id : `${groupId}-option`}
        onChange={onChange}
        ref={ref}
        type={isMulti ? 'checkbox' : 'radio'}
        value={!isMulti ? value : undefined}
        {...otherProps}
      />
    </div>

    <label
      className={`${styles.label} ${disabled ? styles.disabled : ''} ${invalid ? styles.error : ''}`}
      htmlFor={id}
    >
      {label}
    </label>
  </div>;
};

export default SelectableItem;
