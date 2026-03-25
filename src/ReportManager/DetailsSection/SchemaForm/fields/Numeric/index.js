import React, { memo } from 'react';

import NumericInput from '../../../../../NumericInput';

import * as styles from './styles.module.scss';

const Numeric = ({ details, error, id, onFieldChange, readOnly, value = '' }) => {
  const hasError = !!error;

  return <div data-testid={`schema-form-numeric-field-${id}`} className={styles.numeric}>
    <label className={`${styles.label} ${hasError ? styles.error : ''}`} htmlFor={id}>
      {details.label}

      {details.isRequired && <span aria-hidden="true"> *</span>}
    </label>

    <NumericInput
      blockOutOfRangeValues={false}
      id={id}
      inputProps={{
        'aria-describedby': `${id}-description`,
        'aria-errormessage': hasError ? `${id}-description` : undefined,
        'aria-invalid': hasError ? 'true' : 'false',
        'aria-required': details.isRequired
      }}
      max={details.maxInput}
      min={details.minInput}
      onChange={(number) => onFieldChange(id, number || number === 0 ? number : undefined)}
      placeholder={details.hint}
      readOnly={readOnly}
      value={value}
    />

    <p
      className={`${styles.description} ${hasError ? styles.error : ''}`}
      id={`${id}-description`}
    >
      {error?.message || details.description}
    </p>
  </div>;
};

export default memo(Numeric);
