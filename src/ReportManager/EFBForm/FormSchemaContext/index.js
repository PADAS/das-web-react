import React, { createContext } from 'react';

export const FormSchemaContext = createContext(null);

const FormSchemaContextProvider = ({ schema, onFieldChange, formData, children }) => {

  const getSectionProps = (sectionId) => schema.ui.sections[sectionId];

  const getHeaderProps = (headerName) => schema.ui.headers[headerName];

  const getFieldProps = (fieldName) => {
    const jsonProps = schema.json.properties[fieldName];
    const isRequired = schema.json.required.includes(fieldName);
    const uiProps = schema.ui.fields[fieldName];
    return {
      json: jsonProps,
      ui: {
        ...uiProps,
        isRequired
      },
    };
  };

  return <FormSchemaContext.Provider value={{ getSectionProps, getFieldProps, getHeaderProps, onFieldChange, formData }}>
    {children}
  </FormSchemaContext.Provider>;
};

export default FormSchemaContextProvider;
