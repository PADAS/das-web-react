import React, { memo } from 'react';

import LocationPicker from '../../../../../LocationPicker';

import styles from './styles.module.scss';

const Location = ({
  autofillDefaultInput: _autofillDefaultInput,
  details,
  error,
  id,
  onFieldChange,
  value = null,
}) => {
  const hasError = !!error;
  const hasDescription = !!details.description && !hasError;
  const label = details.isRequired ? `${details.label} *` : details.label;

  return <div className={styles.text} data-testid={`schema-form-location-field-${id}`}>
    <label className={`${styles.label} ${hasError ? styles.error : ''}`} htmlFor={id}>{label}</label>

    <LocationPicker
      id={id}
      inputProps={{
        'aria-describedby': hasDescription ? `${id}-description`: undefined,
        'aria-errormessage': hasError ? `${id}-description` : undefined,
        'aria-invalid': hasError,
        'aria-required': details.isRequired,
      }}
      onChange={(newLocation) => onFieldChange(id, newLocation || undefined)}
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

export default memo(Location);
