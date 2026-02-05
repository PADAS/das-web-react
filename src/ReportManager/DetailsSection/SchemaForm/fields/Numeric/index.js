import React, { memo } from 'react';

import NumericInput from '../../../../../NumericInput';

import * as styles from './styles.module.scss';

const Numeric = ({ details, error, id, onFieldChange, value = '' }) => {
  const hasError = !!error;
  const hasDescription = !!details.description && !hasError;
  const label = details.isRequired ? `${details.label} *` : details.label;

  return <div data-testid={`schema-form-numeric-field-${id}`} className={styles.numeric}>
    <label className={`${styles.label} ${hasError ? styles.error : ''}`} htmlFor={id}>
      {label}
    </label>

    <NumericInput
        max={details.maxInput}
        min={details.minInput}
        value={value}
        id={id}
        inputProps={{
          'aria-describedby': hasDescription ? `${id}-description`: undefined,
          'aria-errormessage': hasError ? `${id}-description` : undefined,
          'aria-invalid': hasError,
          'aria-required': details.isRequired
        }}
        blockOutOfRangeValues={false}
        inputClassName={styles.numInput}
        placeholder={details.hint}
        onChange={(number) => {
          onFieldChange(id, number ?? undefined);
        }}
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
