import React, { memo } from 'react';

import Switch from '../../../../../Switch';

import * as styles from './styles.module.scss';

const Boolean = ({ details, error, id, onFieldChange, value = '' }) => {
  const hasError = !!error;
  const hasDescription = !!details.description && !hasError;
  const label = details.isRequired ? `${details.label} *` : details.label;

  return <div className={styles.boolean} data-testid={`schema-form-boolean-field-${id}`}>
    <label className={`${styles.label} ${hasError ? styles.error : ''}`} htmlFor={id}>{label}</label>

    <Switch
      aria-describedby={hasDescription ? `${id}-description`: undefined}
      aria-errormessage={hasError ? `${id}-description` : undefined}
      aria-invalid={hasError}
      aria-required={details.isRequired}
      checked={value}
      className={styles.switch}
      id={id}
      onChange={(event) => onFieldChange(id, event.target.checked)}
    />

    {(hasDescription || hasError) && <p
      aria-live={hasError ? 'assertive' : 'off'}
      className={`${styles.description} ${hasError ? styles.error : ''}`}
      id={`${id}-description`}
    >
      {error?.message || details.description}
    </p>}
  </div>;
};

export default memo(Boolean);
