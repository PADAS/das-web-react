import React, { forwardRef } from 'react';

import * as styles from './styles.module.scss';

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
  groupId,
  isChecked,
  id,
  label,
  onClick,
  readOnly = false,
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

  return <div className={`${styles.container} ${disabled ? styles.disabled : ''} ${className} ${invalid ? styles.error : ''}`}>
    <Ripple>
      <input type={isMulti ? INPUT_ROLES.CHECKBOX : INPUT_ROLES.RADIO}
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
