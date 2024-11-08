import React, { createContext, useContext } from 'react';
import { FORM_FIELDS_TYPES } from '../../../constants';
import { textFieldDetailsFactory } from '../fields/fieldDetailsFactory';
import { getSchemaFieldUIType, isSchemaFieldRequired } from './utils';

export const SchemaFormContext = createContext(null);

const SchemaFormContextProvider = ({ schema, onFieldChange, formData, formErrors, children }) => {

  const getSectionDetails = (sectionName) => schema.ui.sections[sectionName];

  const getHeaderDetails = (fieldName) => schema.ui.headers[fieldName];

  const getFieldDetails = (fieldName) => {
    const fieldSchema = schema.json.properties[fieldName];
    const isRequired = isSchemaFieldRequired(schema, fieldSchema);
    const uiDetails = schema.ui.fields[fieldName];
    const formValue = formData[fieldName] ?? '';
    const formError = formErrors[fieldName] ?? null;

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

  const getSchema = () => ({ ...schema });

  return <SchemaFormContext.Provider value={{ getSectionDetails, getFieldDetails, getHeaderDetails, onFieldChange, getFieldUIType, getSchema }}>
    {children}
  </SchemaFormContext.Provider>;
};

export const useFieldDetails = (fieldName) => {
  const { getSectionDetails, getFieldDetails, getHeaderDetails, getSchema } = useContext(SchemaFormContext);
  const schema = getSchema();

  const isSection = !!schema.ui.sections[fieldName];
  const isField = !!schema.ui.fields[fieldName];

  return isSection
    ? getSectionDetails(fieldName)
    : isField
      ? getFieldDetails(fieldName)
      : getHeaderDetails(fieldName);
};

export default SchemaFormContextProvider;
