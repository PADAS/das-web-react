import React, { useContext } from 'react';

import useFieldDetails from '../../SchemaFormContext/useFieldDetails';
import { SchemaFormContext } from '../../SchemaFormContext';


const VALIDATION_ERROR_TYPES = {
  REQUIRED: 'REQUIRED'
};

export const TextFieldValidators = {
  [VALIDATION_ERROR_TYPES.REQUIRED]: (fieldValue, fieldName, schema) => {
    return schema.json.required.includes(fieldName) ? !fieldValue : false;
  }
};

const Text = ({ fieldName }) => {
  const textFieldDetails = useFieldDetails(fieldName);
  const { onFieldChange } = useContext(SchemaFormContext);

  const handleOnChange = (event) => onFieldChange(fieldName, event.currentTarget.value);

  return <div data-testid={`schema-form-text-field-${fieldName}`}>
    <label htmlFor={fieldName}>{textFieldDetails.label}</label>
    <input id={fieldName}
       value={textFieldDetails.value}
       type="text"
       defaultValue={textFieldDetails.defaultInput}
       placeholder={textFieldDetails.placeholder}
       onChange={handleOnChange}
       data-testid={`schema-form-text-field-input-${fieldName}`} />

    <p>{textFieldDetails.description}</p>
    {
      textFieldDetails.error && (
        <p>Error message</p> /*ToDo: add i18n error message*/
      )
    }
  </div>;
};

export default Text;
