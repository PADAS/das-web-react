import React from 'react';

import * as styles from './styles.module.scss';

const Switch = ({ className = '', checked, disabled = false, ...otherProps }) =>
  <div className={`${styles.switchField} ${className}`} data-testid="switch">
    <span
      className={`${styles.base} ${checked ? styles.checked : ''} ${disabled ? styles.disabled : ''}`}
      data-testid="switch-base"
    >
      <input checked={checked} disabled={disabled} role="switch" type="checkbox" {...otherProps} />

      <span className={styles.thumb} />
    </span>

    <span className={styles.track} />
  </div>;

export default Switch;
