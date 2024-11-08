import React, { forwardRef, useState } from 'react';

import SchemaFormContextProvider from './SchemaFormContext';
import Section from './fields/Section';

import styles from './styles.module.scss';
import { FORM_FIELDS_TYPES } from '../../constants';
import { TextFieldValidators } from './fields/Text';
import { getSchemaFieldUIType } from './SchemaFormContext/utils';

const FormFieldValidators = {
  [FORM_FIELDS_TYPES.TEXT]: TextFieldValidators
};

const SchemaForm = ({ schema, formData = {}, onFormSubmit, className, onChange }, ref) => {

  const [formErrors, setFormErrors] = useState({});

  const handleOnSubmit = (e) => {
    e.preventDefault();

    const formErr = { ...formErrors };

    for (const [fieldName, fieldValue] of Object.entries(formData)) {
      const fieldUIType = getSchemaFieldUIType(schema, fieldName);
      const validators = FormFieldValidators[fieldUIType];

      for (const [errorType, validatorFn] of Object.entries(validators)) {
        const hasError = validatorFn(fieldValue, fieldName, schema);
        if (hasError){
          formErr[fieldName] = errorType;
          break; // breaking the loop for the current field to avoid handling multiple errors per field on screen
        }
      }
    }

    setFormErrors(formErr);

    if ( Object.keys(formErr) === 0 ){
      onFormSubmit();
    }
  };

  const onFieldChange = (field, value) => {
    onChange({
      formData: {
        [field]: value
      }
    });
  };

  return <SchemaFormContextProvider schema={schema} onFieldChange={onFieldChange} formData={formData} formError={formErrors} >
    <form onSubmit={handleOnSubmit} className={className}>
      {
        schema?.ui?.order.map((sectionName) => (
          <Section sectionName={sectionName} key={sectionName} />
        ))
      }
      <button ref={ref} type="submit" className={styles.submitButton} />
    </form>
  </SchemaFormContextProvider>;
};

const SchemaFormForwardRef = forwardRef(SchemaForm);

export default SchemaFormForwardRef;
