import React, { useContext } from 'react';

import useFieldDetails from '../../SchemaFormContext/useFieldDetails';
import { SchemaFormContext } from '../../SchemaFormContext';
import { isFieldRequired } from '../../utils';

import styles from './styles.module.scss';

const ShortTextInput = ({ textFieldDetails, fieldName, onChange, className }) => (
  <input id={fieldName}
           type="text"
           value={textFieldDetails.value || textFieldDetails.defaultInput}
           placeholder={textFieldDetails.placeholder}
           onChange={onChange}
           data-testid={`schema-form-short-text-field-input-${fieldName}`}
           className={className} />
);

const LongTextInput = ({ textFieldDetails, fieldName, onChange, className }) => (
  <textarea id={fieldName}
            value={textFieldDetails.value || textFieldDetails.defaultInput}
            placeholder={textFieldDetails.placeholder}
            onChange={onChange}
            data-testid={`schema-form-long-text-field-input-${fieldName}`}
            className={className}>
  </textarea>
);

const INPUT_TYPE = {
  SHORT: 'SHORT_TEXT',
  LONG: 'LONG_TEXT'
};

const TEXT_INPUT_TYPE_TO_INPUT = {
  [INPUT_TYPE.SHORT]: ShortTextInput,
  [INPUT_TYPE.LONG]: LongTextInput,
};

const VALIDATION_ERROR_TYPES = {
  REQUIRED: 'required'
};

export const TextFieldValidators = {
  [VALIDATION_ERROR_TYPES.REQUIRED]: (fieldValue, fieldName, schema) => {
    return isFieldRequired(fieldName, schema) ? !fieldValue : false;
  }
};

const Text = ({ fieldName }) => {
  const textFieldDetails = useFieldDetails(fieldName);
  const label = textFieldDetails.isRequired ? `${textFieldDetails.label} *` : textFieldDetails.label;
  const TextInput = TEXT_INPUT_TYPE_TO_INPUT[textFieldDetails.inputType];
  const { onFieldChange } = useContext(SchemaFormContext);

  const stylesTheme = {
    [INPUT_TYPE.SHORT]: styles.shortText,
    [INPUT_TYPE.LONG]: styles.longText
  };

  const handleOnChange = (event) => onFieldChange(fieldName, event.currentTarget.value);

  return <div data-testid={`schema-form-text-field-${fieldName}`}>
    <label className={styles.label} htmlFor={fieldName}>
      {label}
    </label>

    <TextInput
        textFieldDetails={textFieldDetails}
        fieldName={fieldName}
        onChange={handleOnChange}
        className={`${styles.textInput} ${stylesTheme[textFieldDetails.inputType]}`} />

    { textFieldDetails.description && <p className={styles.description}>
      {textFieldDetails.description}
    </p>
    }

  </div>;
};

export default Text;
