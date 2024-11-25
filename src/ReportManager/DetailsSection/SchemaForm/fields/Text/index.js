import React, { useContext } from 'react';

import { SchemaFormContext } from '../../SchemaFormContext';

import styles from './styles.module.scss';

const INPUT_TYPE = { SHORT: 'SHORT_TEXT', LONG: 'LONG_TEXT' };

const ShortTextInput = ({ className, details, id, onChange }) => <input
  className={className}
  data-testid={`schema-form-short-text-field-input-${id}`}
  id={id}
  onChange={onChange}
  placeholder={details.placeholder}
  type="text"
  value={details.value || details.defaultInput}
/>;

const LongTextInput = ({ className, details, id, onChange }) => <textarea
  className={className}
  data-testid={`schema-form-long-text-field-input-${id}`}
  id={id}
  onChange={onChange}
  placeholder={details.placeholder}
  value={details.value || details.defaultInput}
/>;

const TEXT_INPUT_TYPE_TO_INPUT = { [INPUT_TYPE.SHORT]: ShortTextInput, [INPUT_TYPE.LONG]: LongTextInput };
const TEXT_INPUT_TYPE_STYLES = { [INPUT_TYPE.SHORT]: styles.shortText, [INPUT_TYPE.LONG]: styles.longText };

const Text = ({ id }) => {
  const { fields, onFieldChange } = useContext(SchemaFormContext);

  const { details } = fields[id];

  const label = details.isRequired ? `${details.label} *` : details.label;
  const TextInput = TEXT_INPUT_TYPE_TO_INPUT[details.inputType];

  return <div data-testid={`schema-form-text-field-${id}`}>
    <label className={styles.label} htmlFor={id}>{label}</label>

    <TextInput
      className={`${styles.textInput} ${TEXT_INPUT_TYPE_STYLES[details.inputType]}`}
      details={details}
      id={id}
      onChange={(event) => onFieldChange(id, event.currentTarget.value)}
    />

    {details.description && <p className={styles.description}>{details.description}</p>}
  </div>;
};

export default Text;
