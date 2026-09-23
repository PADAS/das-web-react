import React from 'react';

import * as styles from './styles.module.scss';

// Text runs out in an ellipsis where it is too long, and only then does a
// title need to spell it out.
const onMouseEnterText = (event) => {
  const text = event.currentTarget;

  text.title = text.scrollWidth > text.clientWidth ? text.textContent : '';
};

const SelectableItem = ({
  className = '',
  description = null,
  disabled = false,
  groupId,
  icon = null,
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
    {!!icon && <span aria-hidden="true" className={styles.icon}>{icon}</span>}

    <span className={styles.text}>
      <span className={styles.display} onMouseEnter={onMouseEnterText}>{label}</span>

      {description && <span className={styles.description} onMouseEnter={onMouseEnterText}>
        {description}
      </span>}
    </span>
  </label>
</div>;

export default SelectableItem;
