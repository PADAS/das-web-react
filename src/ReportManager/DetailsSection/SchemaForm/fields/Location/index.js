import React, { memo, useEffect, useRef } from 'react';

import styles from './styles.module.scss';

const Location = ({ autofillDefaultInput, details, error, id, onFieldChange, value = '' }) => {
  // const shouldAutofillDefaultInputRef = useRef(autofillDefaultInput && details.defaultInput);

  // const Input = INPUTS[details.inputType];

  // const hasError = !!error;
  // const hasDescription = !!details.description && !hasError;
  // const label = details.isRequired ? `${details.label} *` : details.label;

  // useEffect(() => {
  //   if (shouldAutofillDefaultInputRef.current) {
  //     onFieldChange(id, details.defaultInput);

  //     shouldAutofillDefaultInputRef.current = false;
  //   }
  // }, [details.defaultInput, id, onFieldChange, value]);

  return <div className={styles.text} data-testid={`schema-form-text-field-${id}`}>
    {/* <label className={`${styles.label} ${hasError ? styles.error : ''}`} htmlFor={id}>{label}</label>

    <Input
      aria-describedby={hasDescription ? `${id}-description`: undefined}
      aria-errormessage={hasError ? `${id}-description` : undefined}
      aria-invalid={hasError}
      aria-required={details.isRequired}
      className={`${styles.input} ${STYLES[details.inputType]}`}
      id={id}
      onChange={(event) => onFieldChange(id, event.currentTarget.value || undefined)}
      placeholder={details.placeholder}
      value={value}
    />

    {(hasDescription || hasError) && <p
      aria-live={hasError ? 'assertive' : 'off'}
      className={`${styles.description} ${hasError ? styles.error : ''}`}
      id={`${id}-description`}
    >
      {error?.message || details.description}
    </p>} */}
  </div>;
};

export default memo(Location);
