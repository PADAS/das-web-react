import React from 'react';

import * as styles from './styles.module.scss';

const SelectableItem = ({
  className = '',
  description = null,
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
}) => <div
    className={`${styles.selectableItem} ${disabled || readOnly ? styles.inactive : ''} ${className}`}
    data-testid={`selectable-item-${id}`}
  >
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
    <span className={styles.display} title={label}>{label}</span>

    {description && <span className={styles.description} title={description}>{description}</span>}
  </label>
</div>;

export default SelectableItem;
