import React, { createContext } from 'react';
import { FORM_FIELDS_TYPES } from '../../../constants';
import { textFieldDetailsFactory } from '../fields/fieldDetailsFactory';
import { getSchemaFieldUIType, isFieldActive as isFormFieldActive, isSchemaFieldRequired } from './utils';

export const SchemaFormContext = createContext(null);

const SchemaFormContextProvider = ({ schema, onFieldChange, formData, formErrors, children }) => {

  const getSectionDetails = (sectionName) => schema.ui.sections[sectionName];

  const getHeaderDetails = (fieldName) => schema.ui.headers[fieldName];

  const getFieldDetails = (fieldName) => {
    const fieldSchema = schema.json.properties[fieldName];
    const isRequired = isSchemaFieldRequired(schema, fieldName);
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

  const getFieldUIType = (fieldName) => getSchemaFieldUIType(schema, fieldName);

  const isSection = (fieldName) => !!schema.ui.sections[fieldName];

  const isField = (fieldName) => !!schema.ui.fields[fieldName];

  const isFieldActive = (fieldName) => isFormFieldActive(schema, fieldName);

  return <SchemaFormContext.Provider value={{ getSectionDetails, getFieldDetails, getHeaderDetails, onFieldChange, getFieldUIType, isSection, isField, isFieldActive }}>
    {children}
  </SchemaFormContext.Provider>;
};

export default SchemaFormContextProvider;
