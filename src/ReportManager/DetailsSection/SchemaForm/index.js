import React, { useState } from 'react';

import Section from './fields/Section';

import { FORM_FIELDS_TYPES } from './constants';
import { TextFieldValidators } from './fields/Text';
import SchemaFormContextProvider from './SchemaFormContext';
import SchemaSelector from './SchemaSelector';
import { getFieldUIType, isFieldActive } from './utils';

const FormFieldValidators = {
  [FORM_FIELDS_TYPES.TEXT]: TextFieldValidators
};

const SchemaForm = ({ onFormChange, formData, onFormSubmit, renderSubmitButton, className }) => {

  const [formErrors, setFormErrors] = useState({});
  const [schema, setSchema] = useState(null);

  const handleOnSubmit = (e) => {
    e.preventDefault();

    const formErr = {};

    for (const [fieldName, fieldValue] of Object.entries(formData)) {

      if (isFieldActive(fieldName, schema)) {
        const fieldUIType = getFieldUIType(fieldName, schema);
        const validators = FormFieldValidators[fieldUIType];

        for (const [errorType, validatorFn] of Object.entries(validators)) {
          const hasError = validatorFn(fieldValue, fieldName, schema);
          if (hasError){
            formErr[fieldName] = errorType;
            break; // breaking the loop for the current field to avoid handling multiple errors per field on screen
          }
        }
      }
    }

    setFormErrors(formErr);

    if ( Object.keys(formErr).length === 0 ){
      onFormSubmit({ formData });
    }
  };

  const handleOnSchemaSelectorChange = (selectedSchema) => {
    setSchema(selectedSchema);
  };

  return <SchemaFormContextProvider schema={schema} formData={formData} onFormChange={onFormChange} formErrors={formErrors} >
    <SchemaSelector onChange={handleOnSchemaSelectorChange} />
    <form onSubmit={handleOnSubmit} className={className}>
      {
        schema?.ui?.order?.map((sectionName) => (
          <Section sectionName={sectionName} key={sectionName} />
        ))
      }
      {renderSubmitButton()}
    </form>
  </SchemaFormContextProvider>;
};

export default SchemaForm;
