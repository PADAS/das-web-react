import React from 'react';

import * as styles from './styles.module.scss';

const Switch = ({
  className = '',
  checked,
  disabled = false,
  readOnly = false,
  onChange,
  ...otherProps
}) => <div
    className={styles.switch
      + (checked ? ` ${styles.checked}` : '')
      + (readOnly ? ` ${styles.readOnly}` : '')
      + (disabled ? ` ${styles.disabled}` : '')
      + ` ${className}`}
    data-testid="switch"
  >
  <span className={styles.base}>
    <input
      aria-readonly={readOnly ? 'true' : undefined}
      checked={checked}
      disabled={disabled}
      onChange={readOnly ? undefined : (event) => onChange(event.target.checked)}
      readOnly={readOnly}
      role="switch"
      type="checkbox"
      {...otherProps}
    />

    <span className={styles.thumb} />
  </span>

  <span className={styles.track} />
</div>;

export default Switch;
