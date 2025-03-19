import React, { memo, useEffect } from 'react';

import LocationPicker from '../../../../../LocationPicker';

import styles from './styles.module.scss';

const Location = ({
  blurLocationMarker,
  details,
  error,
  focusLocationMarker,
  id,
  onFieldChange,
  value = null,
}) => {
  const hasError = !!error;
  const hasDescription = !!details.description && !hasError;
  const label = details.isRequired ? `${details.label} *` : details.label;

  // When closing a collection item form modal, the location fields get unmounted without triggering the blur event, so
  // we need to blur the location markers manually.
  useEffect(() => () => blurLocationMarker(), [blurLocationMarker]);

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
      onBlur={() => blurLocationMarker()}
      onChange={(newLocation) => onFieldChange(id, newLocation || undefined)}
      onFocus={() => focusLocationMarker(id)}
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
