import React, { useContext, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import SchemaFormContext from '../../SchemaFormContext';

import styles from './styles.module.scss';

const INPUT_TYPE = { SHORT: 'SHORT_TEXT', LONG: 'LONG_TEXT' };

const ShortTextInput = ({ details, id, ...restProps }) => <input
  data-testid={`schema-form-short-text-field-input-${id}`}
  id={id}
  placeholder={details.placeholder}
  type="text"
  {...restProps}
/>;

const LongTextInput = ({ details, id, ...restProps }) => <textarea
  data-testid={`schema-form-long-text-field-input-${id}`}
  id={id}
  placeholder={details.placeholder}
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
    <label className={`${styles.label} ${error ? styles.error : ''}`} htmlFor={id}>{label}</label>

    <TextInput
      className={`${styles.textInput} ${TEXT_INPUT_TYPE_STYLES[details.inputType]} ${error ? styles.error : ''}`}
      details={details}
      id={id}
      onChange={onChange}
      value={value || ''}
    />

    {(details.description || error) && <p className={`${styles.description} ${error ? styles.error : ''}`}>
      {error || details.description}
    </p>}
  </div>;
};

Text.propTypes = { id: PropTypes.string.isRequired };

export default Text;
