import React, { createContext } from 'react';

export const SchemaFormContext = createContext(null);

const SchemaFormContextProvider = ({ children, fields, onFormChange }) => {
  const onFieldChange = (field, value) => onFormChange({ formData: { [field]: value } });

  return <SchemaFormContext.Provider value={{ fields, onFieldChange }}>
    {children}
  </SchemaFormContext.Provider>;
};

export default SchemaFormContextProvider;
