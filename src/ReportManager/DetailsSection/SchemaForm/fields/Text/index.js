import React, { useContext, useEffect, useRef } from 'react';

import SchemaFormContext from '../../SchemaFormContext';

import styles from './styles.module.scss';

const INPUT_TYPE = { SHORT: 'SHORT_TEXT', LONG: 'LONG_TEXT' };

const ShortTextInput = ({ id, ...restProps }) => <input
  data-testid={`schema-form-short-text-field-input-${id}`}
  id={id}
  type="text"
  {...restProps}
/>;

const LongTextInput = ({ id, ...restProps }) => <textarea
  data-testid={`schema-form-long-text-field-input-${id}`}
  id={id}
  {...restProps}
/>;

const TEXT_INPUT_TYPE_TO_INPUT = { [INPUT_TYPE.SHORT]: ShortTextInput, [INPUT_TYPE.LONG]: LongTextInput };
const TEXT_INPUT_TYPE_STYLES = { [INPUT_TYPE.SHORT]: styles.shortText, [INPUT_TYPE.LONG]: styles.longText };

const Text = ({ id }) => {
  const { fields, fieldErrors, fieldValues, onFieldChange } = useContext(SchemaFormContext);

  const hasInputValueBeenChangedRef = useRef(false);

  const { details } = fields[id];
  const error = fieldErrors[id];
  const value = fieldValues[id];

  const TextInput = TEXT_INPUT_TYPE_TO_INPUT[details.inputType];

  const hasError = !!error;
  const hasDescription = !!details.description && !hasError;
  const label = details.isRequired ? `${details.label} *` : details.label;

  const onChange = (event) => {
    onFieldChange(id, event.currentTarget.value);

    hasInputValueBeenChangedRef.current = true;
  };

  useEffect(() => {
    if (!value && !hasInputValueBeenChangedRef.current && details.defaultInput) {
      onFieldChange(id, details.defaultInput);
    }
  }, [details.defaultInput, id, onFieldChange, value]);

  return <div data-testid={`schema-form-text-field-${id}`}>
    <label className={`${styles.label} ${hasError ? styles.error : ''}`} htmlFor={id}>{label}</label>

    <TextInput
      aria-describedby={hasDescription ? `${id}-description`: undefined}
      aria-errormessage={hasError ? `${id}-description` : undefined}
      aria-invalid={hasError}
      aria-required={details.isRequired}
      className={`${styles.textInput} ${TEXT_INPUT_TYPE_STYLES[details.inputType]}`}
      id={id}
      onChange={onChange}
      placeholder={details.placeholder}
      value={value || ''}
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

export default Text;
