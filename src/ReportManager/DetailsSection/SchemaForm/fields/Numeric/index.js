import React, { useEffect, useRef, memo } from 'react';

import styles from './styles.module.scss';

const Numeric = ({ autofillDefaultInput, details, error, id, onFieldChange, value = '' }) => {
  const hasError = !!error;
  const hasDescription = !!details.description && !hasError;
  const label = details.isRequired ? `${details.label} *` : details.label;

  const shouldAutofillDefaultInputRef = useRef(autofillDefaultInput && details.defaultInput);

  useEffect(() => {
    if (shouldAutofillDefaultInputRef.current) {
      onFieldChange(id, details.defaultInput);

      shouldAutofillDefaultInputRef.current = false;
    }
  }, [details.defaultInput, id, onFieldChange, value]);

  return <div data-testid={`schema-form-numeric-field-${id}`} className={styles.numeric}>
    <label className={`${styles.label} ${hasError ? styles.error : ''}`} htmlFor={id}>{label}</label>

    <input aria-describedby={hasDescription ? `${id}-description`: undefined}
           aria-errormessage={hasError ? `${id}-description` : undefined}
           aria-invalid={hasError}
           aria-required={details.isRequired}
           className={styles.numInput}
           id={id}
           onChange={(event) => onFieldChange(id, parseInt(event.currentTarget.value) || undefined)}
           placeholder={details.placeholder}
           value={value}
           max={details.maxInput}
           min={details.minInput}
           type="text"
           inputMode="numeric"
           pattern="[0-9]*" />

    {(hasDescription || hasError) && <p
            aria-live={hasError ? 'assertive' : 'off'}
            className={`${styles.description} ${hasError ? styles.error : ''}`}
            id={`${id}-description`}
        >
        {error || details.description}
    </p>}

  </div>;
};

export default memo(Numeric);
