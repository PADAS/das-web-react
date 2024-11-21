import React, { useContext } from 'react';

import useFieldDetails from '../../SchemaFormContext/useFieldDetails';
import { SchemaFormContext } from '../../SchemaFormContext';
import { isFieldRequired } from '../../utils';


const ShortTextInput = ({ textFieldDetails, fieldName, onChange }) => (
  <input id={fieldName}
           value={textFieldDetails.value}
           type="text"
           defaultValue={textFieldDetails.defaultInput}
           placeholder={textFieldDetails.placeholder}
           onChange={onChange}
           data-testid={`schema-form-short-text-field-input-${fieldName}`} />
);

const LongTextInput = ({ textFieldDetails, fieldName, onChange }) => (
  <textarea id={fieldName} value={textFieldDetails.value}
            defaultValue={textFieldDetails.defaultInput}
            placeholder={textFieldDetails.placeholder}
            onChange={onChange}
            data-testid={`schema-form-long-text-field-input-${fieldName}`}>
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

/*ToDo:
* error message for i18n
* styling
* coverage
* validation for text length
* */

const Text = ({ fieldName }) => {
  const textFieldDetails = useFieldDetails(fieldName);
  const label = textFieldDetails.isRequired ? `${textFieldDetails.label} *` : textFieldDetails.label;
  const TextInput = TEXT_INPUT_TYPE_TO_INPUT[textFieldDetails.inputType];
  const { onFieldChange } = useContext(SchemaFormContext);

  const handleOnChange = (event) => onFieldChange(fieldName, event.currentTarget.value);

  return <div data-testid={`schema-form-text-field-${fieldName}`}>
    <label htmlFor={fieldName}>{label}</label>
    <TextInput textFieldDetails={textFieldDetails} fieldName={fieldName} onChange={handleOnChange} />
    <p>{textFieldDetails.description}</p>
    {
      textFieldDetails.error && (
        <p>Error message</p> /*ToDo: add i18n error message*/
      )
    }
  </div>;
};

export default Text;
