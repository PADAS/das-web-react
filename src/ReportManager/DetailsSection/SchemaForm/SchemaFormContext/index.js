import React, { createContext } from 'react';
import PropTypes from 'prop-types';

export const SchemaFormContext = createContext(null);

const SchemaFormContextProvider = ({ children, fields, formData, onFormChange }) => {
  const onFieldChange = (fieldId, value) => {
    // TODO: Update with recursivity for collections.
    const newFormData = { ...formData, [fieldId]: value };

    onFormChange({ formData: newFormData });
  };

  return <SchemaFormContext.Provider value={{ fields, formData, onFieldChange }}>
    {children}
  </SchemaFormContext.Provider>;
};

SchemaFormContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
  fields: PropTypes.object.isRequired,
  formData: PropTypes.object.isRequired,
  onFormChange: PropTypes.func.isRequired,
};

export default SchemaFormContextProvider;
