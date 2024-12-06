import React, { memo, useEffect, useRef } from 'react';

import { TEXT_ELEMENT_INPUT_TYPES } from '../../constants';

import styles from './styles.module.scss';

const ShortTextInput = (props) => <input type="text" {...props} />;

const LongTextInput = (props) => <textarea {...props} />;

const FIELD_INPUTS = {
  [TEXT_ELEMENT_INPUT_TYPES.SHORT]: ShortTextInput,
  [TEXT_ELEMENT_INPUT_TYPES.LONG]: LongTextInput,
};
const FIELD_STYLES = {
  [TEXT_ELEMENT_INPUT_TYPES.SHORT]: styles.shortText,
  [TEXT_ELEMENT_INPUT_TYPES.LONG]: styles.longText,
};

const Text = ({ autofillDefaultInput, details, error, id, onFieldChange, value = '' }) => {
  const shouldAutofillDefaultInputRef = useRef(autofillDefaultInput && details.defaultInput);

  const TextInput = FIELD_INPUTS[details.inputType];

  const hasError = !!error;
  const hasDescription = !!details.description && !hasError;
  const label = details.isRequired ? `${details.label} *` : details.label;

  useEffect(() => {
    if (shouldAutofillDefaultInputRef.current) {
      onFieldChange(id, details.defaultInput);

      shouldAutofillDefaultInputRef.current = false;
    }
  }, [details.defaultInput, id, onFieldChange, value]);

  return <div data-testid={`schema-form-text-field-${id}`} className={styles.text}>
    <label className={`${styles.label} ${hasError ? styles.error : ''}`} htmlFor={id}>{label}</label>

    <TextInput
      aria-describedby={hasDescription ? `${id}-description`: undefined}
      aria-errormessage={hasError ? `${id}-description` : undefined}
      aria-invalid={hasError}
      aria-required={details.isRequired}
      className={`${styles.textInput} ${FIELD_STYLES[details.inputType]}`}
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
      {error || details.description}
    </p>}
  </div>;
};

export default memo(Text);
