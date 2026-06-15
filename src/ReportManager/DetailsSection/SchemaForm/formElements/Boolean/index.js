import React, { memo } from 'react';

import Switch from '../../../../../Switch';

import * as styles from './styles.module.scss';

const Boolean = ({ details, error, id, onFieldChange, readOnly, value = false }) => {
  const hasError = !!error;

  return <div className={styles.boolean} data-testid={`schema-form-boolean-field-${id}`}>
    <label className={`${styles.label} ${hasError ? styles.error : ''}`} htmlFor={id}>
      {details.label}

      {details.isRequired && <span aria-hidden="true"> *</span>}
    </label>

    <Switch
      aria-describedby={`${id}-description`}
      aria-errormessage={hasError ? `${id}-description` : undefined}
      aria-invalid={hasError ? 'true' : 'false'}
      aria-required={details.isRequired}
      checked={value}
      className={styles.switchField}
      id={id}
      onChange={(checked) => onFieldChange(id, checked)}
      readOnly={readOnly}
    />

    <p
      className={`${styles.description} ${hasError ? styles.error : ''}`}
      id={`${id}-description`}
    >
      {error?.message || details.description}
    </p>
  </div>;
};

export default memo(Boolean);
