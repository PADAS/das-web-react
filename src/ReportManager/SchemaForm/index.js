import React, { useState } from 'react';

import Section from './fields/Section';

import { FORM_FIELDS_TYPES } from './constants';
import { TextFieldValidators } from './fields/Text';
import SchemaFormContextProvider from './SchemaFormContext';

import { getFieldUIType, isFieldActive } from './utils';

const FormFieldValidators = {
  [FORM_FIELDS_TYPES.TEXT]: TextFieldValidators
};

const SchemaForm = ({ schema, onFormChange, formData, onFormSubmit, renderSubmitButton, className }) => {

  const [formErrors, setFormErrors] = useState({});

  const handleOnSubmit = (e) => {
    e.preventDefault();

    const formErr = {};

    for (const [fieldName, fieldValue] of Object.entries(formData)) {

      if (isFieldActive(fieldName, schema)) {
        const fieldUIType = getFieldUIType(fieldName);
        const validators = FormFieldValidators[fieldUIType];

        for (const [errorType, validatorFn] of Object.entries(validators)) {
          const hasError = validatorFn(fieldValue, fieldName, schema);
          if (hasError){
            formErr[fieldName] = errorType;
            break; // breaking the loop for the current field to avoid handling multiple errors per field on screen
          } else {
            delete formErr[fieldName];
          }
        }
      }
    }

    setFormErrors(formErr);

    if ( Object.keys(formErr).length === 0 ){
      onFormSubmit({ formData });
    }
  };

  return <SchemaFormContextProvider schema={schema} formData={formData} onFormChange={onFormChange} formErrors={formErrors} >
    <form onSubmit={handleOnSubmit} className={className}>
      {
        schema.ui.order.map((sectionName) => (
          <Section sectionName={sectionName} key={sectionName} />
        ))
      }
      {renderSubmitButton()}
    </form>
  </SchemaFormContextProvider>;
};

export default SchemaForm;
