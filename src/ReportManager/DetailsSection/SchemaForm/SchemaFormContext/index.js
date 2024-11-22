import React, { createContext } from 'react';

export const SchemaFormContext = createContext(null);

const SchemaFormContextProvider = ({ children, fields, formErrors, onFormChange }) => {
  const onFieldChange = (field, value) => onFormChange({ formData: { [field]: value } });

  return <SchemaFormContext.Provider value={{ fields, formErrors, onFieldChange }}>
    {children}
  </SchemaFormContext.Provider>;
};

export default SchemaFormContextProvider;
