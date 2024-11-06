import React, { useEffect, useState } from 'react';

import SchemaFormContextProvider from './SchemaFormContext';
import Section from './fields/Section';

const SchemaForm = ({ schema, formData: initialFormData = {}, isDisabled, className, onChange, onError }) => {
  const [formData, setFormData] = useState(initialFormData);

  const onSubmit = (e) => {
    e.preventDefault();
  };

  const onFieldChange = (field, value) => {
    setFormData((data) => ({
      ...data,
      [field]: value
    }));
  };

  useEffect(() => {
    onChange({
      formData
    });
  }, [formData, onChange]);

  return <SchemaFormContextProvider schema={schema} onFieldChange={onFieldChange} formData={formData}>
    <form onSubmit={onSubmit}>
      {
        schema?.ui?.order.map((sectionName) => (
          <Section sectionName={sectionName} key={sectionName} />
        ))
      }
    </form>
  </SchemaFormContextProvider>;
};

export default SchemaForm;
