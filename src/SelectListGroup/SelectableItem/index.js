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
  readOnly,
  ref,
  value,
  ...otherProps
}) => <div className={`${styles.selectableItem} ${disabled || readOnly ? styles.inactive : ''} ${className}`}>
  <div className={styles.ripple}>
    <input
      checked={isChecked}
      className={styles.input}
      data-testid={`input-for-${label}`}
      disabled={disabled}
      id={id}
      name={isMulti ? id : `${groupId}-option`}
      onChange={readOnly ? undefined : () => onClick(value, !isChecked)}
      readOnly={readOnly}
      ref={ref}
      type={isMulti ? 'checkbox' : 'radio'}
      value={!isMulti ? value : undefined}
      {...otherProps}
    />
  </div>

  <label
    className={`${styles.label} ${invalid ? styles.error : ''}`}
    htmlFor={id}
  >
    {label}
  </label>
</div>;

export default SelectableItem;
