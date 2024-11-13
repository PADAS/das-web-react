import React, { createContext } from 'react';
import { FORM_FIELDS_TYPES } from '../constants';
import { textFieldDetailsFactory } from '../fields/fieldDetailsFactory';
import { isFieldRequired } from '../utils';

export const SchemaFormContext = createContext(null);


const SchemaFormContextProvider = ({ schema, onFormChange, formData, formErrors, children }) => {

  const onFieldChange = (field, value) => {
    onFormChange({
      formData: {
        [field]: value
      }
    });
  };

  const getFieldDetails = (fieldName, schema) => {
    const fieldSchema = schema.json.properties[fieldName];
    const isRequired = isFieldRequired(fieldName, schema);
    const uiDetails = schema.ui.fields[fieldName];
    const formValue = formData[fieldName] ?? '';
    const formError = formErrors?.[fieldName] ?? null;

    switch (uiDetails.type) {
    case FORM_FIELDS_TYPES.TEXT: {
      return textFieldDetailsFactory(fieldSchema, {
        ...uiDetails,
        isRequired
      }, formValue, formError);
    }

    default: return {};
    }
  };

  const getSchema = () => ({ ...schema });

  return <SchemaFormContext.Provider value={{
    formErrors,
    getFieldDetails,
    getSchema,
    onFieldChange
  }}>
    {children}
  </SchemaFormContext.Provider>;
};

export default SchemaFormContextProvider;
