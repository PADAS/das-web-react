import React, { memo } from 'react';

import NumericInput from '../../../../../NumericInput';

import * as styles from './styles.module.scss';

const Numeric = ({ details, error, id, onFieldChange, readOnly, value = '' }) => {
  const hasError = !!error;
  const hasDescription = !!details.description && !hasError;
  const label = details.isRequired ? `${details.label} *` : details.label;

  return <div data-testid={`schema-form-numeric-field-${id}`} className={styles.numeric}>
    <label className={`${styles.label} ${hasError ? styles.error : ''}`} htmlFor={id}>
      {label}
    </label>

    <NumericInput
      blockOutOfRangeValues={false}
      id={id}
      inputProps={{
        'aria-describedby': hasDescription ? `${id}-description`: undefined,
        'aria-errormessage': hasError ? `${id}-description` : undefined,
        'aria-invalid': hasError,
        'aria-required': details.isRequired
      }}
      max={details.maxInput}
      min={details.minInput}
      placeholder={details.hint}
      onChange={(number) => onFieldChange(id, number ?? undefined)}
      readOnly={readOnly}
      value={value}
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

export default memo(Numeric);
